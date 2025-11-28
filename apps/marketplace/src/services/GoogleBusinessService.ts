// services/GoogleBusinessService.ts
import { google } from 'googleapis';

interface BusinessCreationData {
    llc_name: string;
    category: string; // 'Painters', 'Plumbers', etc.
    city: string;
    state: string;
    state_code: string;
    zip_code: string;
    description: string;
    service_areas: string[]; // ['Dayton', 'Kettering', 'Beavercreek']
    phone_number?: string;
    website?: string;
}

interface GoogleBusinessProfile {
    location_id: string;
    name: string;
    google_maps_url: string;
    verification_status: 'UNVERIFIED' | 'VERIFIED' | 'PENDING';
    workspace_email: string;
    workspace_password: string;
    google_voice_number?: string;
}

export class GoogleBusinessService {
    private auth: any;
    private myBusiness: any;
    private admin: any;

    constructor() {
        // Initialize Google OAuth2 client
        this.auth = new google.auth.OAuth2(
            process.env.VITE_GOOGLE_CLIENT_ID,
            process.env.VITE_GOOGLE_CLIENT_SECRET,
            process.env.VITE_GOOGLE_REDIRECT_URI
        );

        // Set credentials (you'll need to get these from OAuth flow)
        this.auth.setCredentials({
            access_token: process.env.GOOGLE_ACCESS_TOKEN,
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        // Initialize APIs
        this.myBusiness = google.mybusinessbusinessinformation({
            version: 'v1',
            auth: this.auth
        });

        this.admin = google.admin({
            version: 'directory_v1',
            auth: this.auth
        });
    }

    /**
     * Create complete Google presence for turnkey business
     */
    async createBusinessPresence(
        businessData: BusinessCreationData
    ): Promise<GoogleBusinessProfile> {
        console.log(`Creating Google presence for ${businessData.llc_name}...`);

        // Step 1: Create Google Workspace account
        const workspaceAccount = await this.createWorkspaceAccount(businessData);

        // Step 2: Create Google Business Profile
        const businessProfile = await this.createBusinessProfile(
            businessData,
            workspaceAccount.email
        );

        // Step 3: Get Google Voice number (optional)
        const voiceNumber = await this.getGoogleVoiceNumber(
            businessData.state_code,
            businessData.llc_name
        );

        // Step 4: Request verification
        await this.requestVerification(businessProfile.location_id);

        return {
            location_id: businessProfile.location_id,
            name: businessProfile.name,
            google_maps_url: businessProfile.google_maps_url,
            verification_status: 'PENDING',
            workspace_email: workspaceAccount.email,
            workspace_password: workspaceAccount.password,
            google_voice_number: voiceNumber
        };
    }

    /**
     * Create Google Workspace account for business
     */
    private async createWorkspaceAccount(businessData: BusinessCreationData) {
        // Generate email from business name
        const domain = 'constructivedesignsinc.org'; // Your nonprofit domain
        const emailPrefix = businessData.llc_name
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/llc/gi, '')
            .substring(0, 30);

        const email = `${emailPrefix}@${domain}`;
        const password = this.generateSecurePassword();

        try {
            const response = await this.admin.users.insert({
                requestBody: {
                    primaryEmail: email,
                    name: {
                        givenName: businessData.city,
                        familyName: businessData.category
                    },
                    password: password,
                    changePasswordAtNextLogin: false,
                    orgUnitPath: '/Turnkey Businesses', // Organizational unit
                    includeInGlobalAddressList: true
                }
            });

            console.log(`✓ Created Google Workspace account: ${email}`);

            return {
                email,
                password,
                user_id: response.data.id
            };
        } catch (error: any) {
            console.error('Failed to create Workspace account:', error);
            throw new Error(`Workspace creation failed: ${error.message}`);
        }
    }

    /**
     * Create Google Business Profile (Google My Business)
     */
    private async createBusinessProfile(
        businessData: BusinessCreationData,
        workspaceEmail: string
    ) {
        // Map category to Google category ID
        const categoryId = this.getGoogleCategoryId(businessData.category);

        try {
            const response = await this.myBusiness.locations.create({
                requestBody: {
                    title: businessData.llc_name,
                    categories: {
                        primaryCategory: {
                            displayName: businessData.category,
                            categoryId: categoryId
                        }
                    },
                    storefrontAddress: {
                        locality: businessData.city,
                        administrativeArea: businessData.state_code,
                        postalCode: businessData.zip_code,
                        regionCode: 'US',
                        addressLines: ['123 Main St'] // Placeholder - use nonprofit address
                    },
                    websiteUri: businessData.website || `https://constructivedesignsinc.org/business/${businessData.llc_name.toLowerCase().replace(/\s+/g, '-')}`,
                    phoneNumbers: {
                        primaryPhone: businessData.phone_number || '+1-937-555-0100'
                    },
                    profile: {
                        description: businessData.description
                    },
                    serviceArea: {
                        businessType: 'SERVICE_AREA_BUSINESS',
                        places: {
                            placeInfos: businessData.service_areas.map(area => ({
                                name: `${area}, ${businessData.state_code}`
                            }))
                        }
                    },
                    metadata: {
                        mapsUri: '', // Will be populated after creation
                        newReviewUri: ''
                    }
                }
            });

            const locationId = response.data.name; // Format: accounts/{accountId}/locations/{locationId}
            const mapsUrl = `https://maps.google.com/?cid=${response.data.metadata?.cid}`;

            console.log(`✓ Created Google Business Profile: ${locationId}`);
            console.log(`✓ Google Maps URL: ${mapsUrl}`);

            return {
                location_id: locationId,
                name: businessData.llc_name,
                google_maps_url: mapsUrl
            };
        } catch (error: any) {
            console.error('Failed to create Business Profile:', error);
            throw new Error(`Business Profile creation failed: ${error.message}`);
        }
    }

    /**
     * Request verification for business
     */
    private async requestVerification(locationId: string) {
        try {
            // Request postcard verification (most common method)
            const response = await this.myBusiness.locations.verify({
                name: locationId,
                requestBody: {
                    method: 'ADDRESS', // Postcard verification
                    languageCode: 'en-US'
                }
            });

            console.log(`✓ Verification requested for ${locationId}`);
            console.log(`  Method: Postcard to business address`);
            console.log(`  Expected delivery: 5-7 business days`);

            return response.data;
        } catch (error: any) {
            console.error('Verification request failed:', error);
            // Non-critical - can be done manually later
        }
    }

    /**
     * Get Google Voice number for business
     */
    private async getGoogleVoiceNumber(
        stateCode: string,
        businessName: string
    ): Promise<string | undefined> {
        // Note: Google Voice API is limited - may need manual setup
        // For now, return placeholder
        console.log(`⚠ Google Voice number needs manual setup for ${businessName}`);
        return undefined;
    }

    /**
     * Map business category to Google category ID
     */
    private getGoogleCategoryId(category: string): string {
        const categoryMap: Record<string, string> = {
            'Painters': 'gcid:painter',
            'Plumbers': 'gcid:plumber',
            'Electricians': 'gcid:electrician',
            'HVAC': 'gcid:hvac_contractor',
            'Landscaping': 'gcid:landscape_designer',
            'Roofing': 'gcid:roofing_contractor',
            'Flooring': 'gcid:flooring_contractor',
            'Cleaning Services': 'gcid:house_cleaning_service',
            'Handyman': 'gcid:handyman',
            'Pest Control': 'gcid:pest_control_service',
            'Pool Services': 'gcid:pool_cleaning_service',
            'Tree Services': 'gcid:tree_service',
            'Junk Removal': 'gcid:garbage_collection_service',
            'Window Cleaning': 'gcid:window_cleaning_service',
            'Gutter Cleaning': 'gcid:gutter_cleaning_service',
            'Auto Mechanics': 'gcid:auto_repair_shop',
            'Mobile Mechanics': 'gcid:mobile_mechanic',
            'Auto Detailing': 'gcid:car_detailing_service',
            'Photography': 'gcid:photographer',
            'Catering': 'gcid:caterer',
            'Event Planning': 'gcid:event_planner'
        };

        return categoryMap[category] || 'gcid:general_contractor';
    }

    /**
     * Generate secure password for Workspace account
     */
    private generateSecurePassword(): string {
        const length = 16;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';

        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        return password;
    }

    /**
     * Transfer ownership to auction winner
     */
    async transferOwnership(
        locationId: string,
        workspaceEmail: string,
        newOwnerEmail: string
    ): Promise<void> {
        console.log(`Transferring ownership to ${newOwnerEmail}...`);

        // Step 1: Add new owner as admin to Business Profile
        await this.myBusiness.locations.admins.create({
            parent: locationId,
            requestBody: {
                admin: newOwnerEmail,
                role: 'PRIMARY_OWNER'
            }
        });

        // Step 2: Transfer Workspace account ownership
        await this.admin.users.update({
            userKey: workspaceEmail,
            requestBody: {
                recoveryEmail: newOwnerEmail,
                changePasswordAtNextLogin: true // Force password change
            }
        });

        console.log(`✓ Ownership transferred to ${newOwnerEmail}`);
    }

    /**
     * Get business insights/analytics
     */
    async getBusinessInsights(locationId: string) {
        try {
            const response = await this.myBusiness.locations.getGoogleUpdated({
                name: locationId,
                readMask: 'name,title,phoneNumbers,categories,storefrontAddress,websiteUri,regularHours,specialHours,serviceArea,labels,adWordsLocationExtensions,latlng,openInfo,metadata,profile,relationshipData,moreHours'
            });

            return response.data;
        } catch (error: any) {
            console.error('Failed to get business insights:', error);
            return null;
        }
    }

    /**
     * Update business information
     */
    async updateBusinessInfo(
        locationId: string,
        updates: Partial<BusinessCreationData>
    ): Promise<void> {
        try {
            await this.myBusiness.locations.patch({
                name: locationId,
                updateMask: 'title,phoneNumbers,websiteUri,profile.description',
                requestBody: {
                    title: updates.llc_name,
                    phoneNumbers: updates.phone_number ? {
                        primaryPhone: updates.phone_number
                    } : undefined,
                    websiteUri: updates.website,
                    profile: updates.description ? {
                        description: updates.description
                    } : undefined
                }
            });

            console.log(`✓ Updated business info for ${locationId}`);
        } catch (error: any) {
            console.error('Failed to update business info:', error);
            throw error;
        }
    }
}

export default GoogleBusinessService;
