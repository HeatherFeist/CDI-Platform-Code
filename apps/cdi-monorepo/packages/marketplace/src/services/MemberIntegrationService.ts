import { createClient } from '@supabase/supabase-js';
// import { GoogleWorkspaceConnector } from './GoogleWorkspaceConnector';

// Temporarily disable Google Workspace integration
class MockGoogleWorkspaceConnector {
  async initialize() { console.warn('Google Workspace integration disabled'); }
  async addMemberToSheet(...args: any[]) { console.warn('Google Workspace integration disabled'); }
  async updateMemberStatus(...args: any[]) { console.warn('Google Workspace integration disabled'); }
  async sendWelcomeEmail(...args: any[]) { console.warn('Google Workspace integration disabled'); }
  async createMemberFolder(...args: any[]) { console.warn('Google Workspace integration disabled'); }
  async scheduleMentorMeeting(...args: any[]) { console.warn('Google Workspace integration disabled'); }
  async syncPendingApplications() { console.warn('Google Workspace integration disabled'); return []; }
}

interface MemberApplicationData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  storeName: string;
  storeDescription: string;
  businessType: string;
  tierRequested: string;
  referralCode?: string;
  mentorUsername?: string;
  formResponseId?: string;
  timestamp: string;
}

interface MemberStore {
  store_name: string;
  store_slug: string;
  store_description: string;
  business_type: string;
  is_active: boolean;
  membership_tier: string;
  member_id: string;
}

export class MemberIntegrationService {
  private supabase;
  private workspaceConnector: MockGoogleWorkspaceConnector;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.workspaceConnector = new MockGoogleWorkspaceConnector();
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.workspaceConnector.initialize();
  }

  /**
   * Process Google Forms webhook
   */
  async processFormWebhook(formData: any): Promise<{ success: boolean; message: string; applicationId?: string }> {
    try {
      // Parse the form data into our standard format
      const applicationData = this.parseWebhookData(formData);
      
      // Create member application in database
      const applicationId = await this.createMemberApplication(applicationData);
      
      // Add to Google Sheets for tracking
      await this.workspaceConnector.addMemberToSheet(applicationData);
      
      // Auto-approve Free tier applications
      if (applicationData.tierRequested.toLowerCase() === 'free') {
        await this.autoApproveFreeApplication(applicationId, applicationData);
      } else {
        // Send notification to admin for manual review
        await this.notifyAdminForReview(applicationData);
      }

      return {
        success: true,
        message: 'Application processed successfully',
        applicationId
      };
    } catch (error) {
      console.error('Error processing form webhook:', error);
      return {
        success: false,
        message: 'Failed to process application'
      };
    }
  }

  /**
   * Parse webhook data from Google Forms
   */
  private parseWebhookData(formData: any): MemberApplicationData {
    // This will depend on your specific Google Forms setup
    // You may need to adjust the field mappings based on your form structure
    return {
      email: formData.email || formData.respondentEmail,
      firstName: formData.firstName || formData['entry.firstName'],
      lastName: formData.lastName || formData['entry.lastName'],
      phone: formData.phone || formData['entry.phone'],
      address: formData.address || formData['entry.address'],
      city: formData.city || formData['entry.city'],
      state: formData.state || formData['entry.state'],
      zipCode: formData.zipCode || formData['entry.zipCode'],
      storeName: formData.storeName || formData['entry.storeName'],
      storeDescription: formData.storeDescription || formData['entry.storeDescription'],
      businessType: formData.businessType || formData['entry.businessType'],
      tierRequested: formData.tierRequested || formData['entry.tierRequested'],
      referralCode: formData.referralCode || formData['entry.referralCode'],
      mentorUsername: formData.mentorUsername || formData['entry.mentorUsername'],
      formResponseId: formData.responseId || formData.id,
      timestamp: formData.timestamp || new Date().toISOString()
    };
  }

  /**
   * Create member application in Supabase
   */
  async createMemberApplication(applicationData: MemberApplicationData): Promise<string> {
    const { data, error } = await this.supabase
      .from('member_applications')
      .insert({
        email: applicationData.email,
        first_name: applicationData.firstName,
        last_name: applicationData.lastName,
        phone: applicationData.phone,
        address: applicationData.address,
        city: applicationData.city,
        state: applicationData.state,
        zip_code: applicationData.zipCode,
        store_name: applicationData.storeName,
        store_description: applicationData.storeDescription,
        business_type: applicationData.businessType,
        tier_requested: applicationData.tierRequested,
        referral_code: applicationData.referralCode,
        mentor_username: applicationData.mentorUsername,
        google_form_response_id: applicationData.formResponseId,
        status: applicationData.tierRequested.toLowerCase() === 'free' ? 'approved' : 'pending',
        applied_at: applicationData.timestamp
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating member application:', error);
      throw new Error('Failed to create member application');
    }

    return data.id;
  }

  /**
   * Auto-approve Free tier applications
   */
  async autoApproveFreeApplication(applicationId: string, applicationData: MemberApplicationData): Promise<void> {
    try {
      // Get the application data
      const { data: application, error: appError } = await this.supabase
        .from('member_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;

      // Create user account if it doesn't exist
      const userId = await this.getOrCreateUser(applicationData);

      // Create member store
      const storeData = await this.createMemberStore(userId, applicationData, 'free');

      // Update application status
      await this.supabase
        .from('member_applications')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: 'system',
          member_id: userId
        })
        .eq('id', applicationId);

      // Update Google Sheets status
      await this.workspaceConnector.updateMemberStatus(
        applicationData.email, 
        'APPROVED - AUTO', 
        'Free tier auto-approved'
      );

      // Send welcome email
      await this.workspaceConnector.sendWelcomeEmail(applicationData, storeData);

      // Create Drive folder for member documents
      await this.workspaceConnector.createMemberFolder(applicationData);

      // Assign mentor if referral code provided
      if (applicationData.referralCode || applicationData.mentorUsername) {
        // Only assign mentor if we have a valid mentor username
        const mentorId = applicationData.mentorUsername || applicationData.referralCode;
        if (mentorId) {
          await this.assignMentor(userId, mentorId);
        }
      }

      console.log(`Free tier application auto-approved for ${applicationData.email}`);
    } catch (error) {
      console.error('Error auto-approving free application:', error);
      throw error;
    }
  }

  /**
   * Get existing user or create new one
   */
  async getOrCreateUser(applicationData: MemberApplicationData): Promise<string> {
    // First check if user already exists
    const { data: existingUser } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('email', applicationData.email)
      .single();

    if (existingUser) {
      return existingUser.id;
    }

    // Create new user account
    const { data: authUser, error: authError } = await this.supabase.auth.admin.createUser({
      email: applicationData.email,
      password: this.generateTemporaryPassword(),
      email_confirm: true,
      user_metadata: {
        first_name: applicationData.firstName,
        last_name: applicationData.lastName,
        phone: applicationData.phone,
        is_nonprofit_member: true,
        onboarding_complete: false
      }
    });

    if (authError) {
      console.error('Error creating user:', authError);
      throw new Error('Failed to create user account');
    }

    // Create profile
    const { error: profileError } = await this.supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: applicationData.email,
        first_name: applicationData.firstName,
        last_name: applicationData.lastName,
        phone: applicationData.phone,
        address: applicationData.address,
        city: applicationData.city,
        state: applicationData.state,
        zip_code: applicationData.zipCode,
        is_nonprofit_member: true,
        member_since: new Date().toISOString()
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw new Error('Failed to create user profile');
    }

    return authUser.user.id;
  }

  /**
   * Create member store
   */
  async createMemberStore(userId: string, applicationData: MemberApplicationData, tier: string): Promise<MemberStore> {
    const storeSlug = this.generateStoreSlug(applicationData.storeName);

    const storeData: Omit<MemberStore, 'member_id'> & { member_id: string } = {
      store_name: applicationData.storeName,
      store_slug: storeSlug,
      store_description: applicationData.storeDescription,
      business_type: applicationData.businessType,
      is_active: true,
      membership_tier: tier,
      member_id: userId
    };

    const { data, error } = await this.supabase
      .from('member_stores')
      .insert({
        ...storeData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating member store:', error);
      throw new Error('Failed to create member store');
    }

    return data;
  }

  /**
   * Generate unique store slug
   */
  private generateStoreSlug(storeName: string): string {
    const baseSlug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    return `${baseSlug}-${timestamp}`;
  }

  /**
   * Generate temporary password
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Assign mentor to new member
   */
  async assignMentor(memberId: string, mentorIdentifier: string): Promise<void> {
    try {
      // Find mentor by username or referral code
      const { data: mentor } = await this.supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .or(`username.eq.${mentorIdentifier},referral_code.eq.${mentorIdentifier}`)
        .eq('is_mentor', true)
        .single();

      if (mentor) {
        // Create mentorship relationship
        await this.supabase
          .from('member_mentorships')
          .insert({
            mentor_id: mentor.id,
            mentee_id: memberId,
            status: 'active',
            started_at: new Date().toISOString()
          });

        // Schedule initial meeting (optional)
        const meetingTime = new Date();
        meetingTime.setDate(meetingTime.getDate() + 7); // One week from now
        
        const { data: memberData } = await this.supabase
          .from('profiles')
          .select('email')
          .eq('id', memberId)
          .single();

        if (memberData) {
          await this.workspaceConnector.scheduleMentorMeeting(
            memberData.email,
            mentor.email,
            meetingTime
          );
        }
      }
    } catch (error) {
      console.error('Error assigning mentor:', error);
      // Don't throw error - mentorship is optional
    }
  }

  /**
   * Notify admin for manual review
   */
  async notifyAdminForReview(applicationData: MemberApplicationData): Promise<void> {
    // Send notification to admin email or Slack channel
    // This could also create a task in your admin dashboard
    console.log(`Manual review needed for ${applicationData.tierRequested} tier application from ${applicationData.email}`);
    
    // Update Google Sheets with pending status
    await this.workspaceConnector.updateMemberStatus(
      applicationData.email,
      'PENDING REVIEW',
      `${applicationData.tierRequested} tier requires manual approval`
    );
  }

  /**
   * Manually approve application
   */
  async manuallyApproveApplication(applicationId: string): Promise<void> {
    const { data: application, error } = await this.supabase
      .from('member_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (error || !application) {
      throw new Error('Application not found');
    }

    const applicationData: MemberApplicationData = {
      email: application.email,
      firstName: application.first_name,
      lastName: application.last_name,
      phone: application.phone,
      address: application.address,
      city: application.city,
      state: application.state,
      zipCode: application.zip_code,
      storeName: application.store_name,
      storeDescription: application.store_description,
      businessType: application.business_type,
      tierRequested: application.tier_requested,
      referralCode: application.referral_code,
      mentorUsername: application.mentor_username,
      formResponseId: application.google_form_response_id,
      timestamp: application.applied_at
    };

    // Create user and store
    const userId = await this.getOrCreateUser(applicationData);
    const storeData = await this.createMemberStore(userId, applicationData, application.tier_requested);

    // Update application
    await this.supabase
      .from('member_applications')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        member_id: userId
      })
      .eq('id', applicationId);

    // Send welcome email
    await this.workspaceConnector.sendWelcomeEmail(applicationData, storeData);

    // Update Google Sheets
    await this.workspaceConnector.updateMemberStatus(
      applicationData.email,
      'APPROVED - MANUAL',
      `${application.tier_requested} tier manually approved`
    );
  }

  /**
   * Sync all pending applications from Google Forms
   */
  async syncAllPendingApplications(): Promise<void> {
    try {
      const pendingApplications = await this.workspaceConnector.syncPendingApplications();
      
      for (const application of pendingApplications) {
        await this.processFormWebhook(application);
      }

      console.log(`Synced ${pendingApplications.length} pending applications`);
    } catch (error) {
      console.error('Error syncing pending applications:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const memberIntegrationService = new MemberIntegrationService();