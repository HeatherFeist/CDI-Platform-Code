import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isConfigured } from '../supabase';
// import { provisionWorkspaceAccount } from '../services/workspaceProvisioningService'; // DISABLED - needs server-side

type UserRole = 'admin' | 'manager' | 'technician' | 'sales';
type UserContext = 'business_owner' | 'team_member' | 'contractor' | 'subcontractor';

interface UserProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role: UserRole;
    business_id: string;
    username?: string;
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    zip_code?: string; // For AI job costing regional pricing
    is_available_for_work?: boolean;
    is_seeking_help?: boolean;
    skills?: string[];
    hourly_rate?: number;
    rating?: number;
    total_projects?: number;
    completed_projects?: number;
    public_profile?: boolean;
    badge_tier?: string;
    badge_level?: number;
    badge_icon?: string;
    badge_color?: string;
    created_at: string;
    updated_at: string;
}

interface UserContextInfo {
    context: UserContext;
    businessId?: string;
    teamMemberId?: string;
    label: string;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
    currentContext: UserContext;
    availableContexts: UserContextInfo[];
    switchContext: (context: UserContext, contextId?: string) => void;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, profile: { first_name: string; last_name: string; role: UserRole; business_id?: string }) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateUserRole: (newRole: UserRole) => Promise<void>;
    hasRole: (roles: UserRole[]) => boolean;
    isAdmin: () => boolean;
    canAccessBusinessFeatures: () => boolean;
    canAccessTeamMemberFeatures: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentContext, setCurrentContext] = useState<UserContext>('business_owner');
    const [availableContexts, setAvailableContexts] = useState<UserContextInfo[]>([]);

    useEffect(() => {
        console.log('🔄 AuthProvider initializing...');
        
        if (!isConfigured || !supabase) {
            console.log('⚠️ Supabase not configured, skipping auth');
            setLoading(false);
            return;
        }

        // Safety timeout - never stay loading forever
        const safetyTimeout = setTimeout(() => {
            console.warn('⚠️ Auth loading timeout - forcing loading=false');
            setLoading(false);
        }, 5000);

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('📝 Initial session:', session ? 'Found' : 'None');
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserProfile(session.user.id);
            } else {
                setLoading(false);
                clearTimeout(safetyTimeout);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔔 Auth state changed:', event);
                setSession(session);
                setUser(session?.user ?? null);
                
                if (session?.user) {
                    await fetchUserProfile(session.user.id);
                } else {
                    setUserProfile(null);
                    setLoading(false);
                }
            }
        );

        return () => {
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const fetchUserProfile = async (userId: string) => {
        try {
            console.log('Fetching user profile for:', userId);
            
            // Add timeout to prevent infinite loading
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Profile fetch timeout')), 10000);
            });
            
            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

            if (error) {
                console.error('Error fetching profile:', error);
                
                // If profile doesn't exist, it might be a new user or the trigger failed
                if (error.code === 'PGRST116') {
                    console.log('Profile not found, user might need to complete signup or profile creation failed');
                    setUserProfile(null);
                } else if (error.message === 'Profile fetch timeout') {
                    console.error('Profile fetch timed out - possible RLS policy issue or database connection problem');
                    setUserProfile(null);
                    setError('Unable to load user profile. Please try refreshing the page.');
                }
                setLoading(false);
                return;
            }

            console.log('User profile fetched:', data);
            setUserProfile(data);
            
            // Fetch available contexts for this user
            await fetchAvailableContexts(userId);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setUserProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableContexts = async (userId: string) => {
        try {
            const contexts: UserContextInfo[] = [];

            // Check if user owns a business
            const { data: profileData } = await supabase
                .from('profiles')
                .select('business_id')
                .eq('id', userId)
                .single();

            if (profileData?.business_id) {
                const { data: businessData } = await supabase
                    .from('businesses')
                    .select('name')
                    .eq('id', profileData.business_id)
                    .single();

                contexts.push({
                    context: 'business_owner',
                    businessId: profileData.business_id,
                    label: `My Business: ${businessData?.name || 'My Business'}`
                });
            }

            // Check if user is a team member on other projects
            const { data: teamMemberData } = await supabase
                .from('team_members')
                .select('id, business_id')
                .eq('profile_id', userId);

            if (teamMemberData && teamMemberData.length > 0) {
                for (const tm of teamMemberData) {
                    const { data: businessData } = await supabase
                        .from('businesses')
                        .select('name')
                        .eq('id', tm.business_id)
                        .single();

                    contexts.push({
                        context: 'team_member',
                        teamMemberId: tm.id,
                        businessId: tm.business_id,
                        label: `Team Member: ${businessData?.name || 'Project Team'}`
                    });
                }
            }

            setAvailableContexts(contexts);
            
            // Set default context
            if (contexts.length > 0) {
                setCurrentContext(contexts[0].context);
            }
        } catch (error) {
            console.error('Error fetching contexts:', error);
        }
    };

    const switchContext = (context: UserContext, contextId?: string) => {
        setCurrentContext(context);
        // Could save preference to localStorage or database
        localStorage.setItem('userContext', context);
        if (contextId) {
            localStorage.setItem('contextId', contextId);
        }
    };

    const updateUserRole = async (newRole: UserRole) => {
        if (!userProfile) {
            throw new Error('No user profile loaded');
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userProfile.id);

            if (error) throw error;

            // Refresh profile
            await fetchUserProfile(userProfile.id);
            
            alert(`Role updated to ${newRole} successfully!`);
        } catch (error) {
            console.error('Error updating role:', error);
            throw error;
        }
    };

    const canAccessBusinessFeatures = (): boolean => {
        return currentContext === 'business_owner' || currentContext === 'contractor';
    };

    const canAccessTeamMemberFeatures = (): boolean => {
        return currentContext === 'team_member' || currentContext === 'subcontractor';
    };

    const signIn = async (email: string, password: string) => {
        if (!supabase) {
            throw new Error('Supabase not configured');
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw error;
        }
    };

    const signUp = async (
        email: string, 
        password: string, 
        profile: { first_name: string; last_name: string; role: UserRole; business_id?: string }
    ) => {
        if (!supabase) {
            throw new Error('Supabase not configured');
        }

        console.log('🔄 Starting signup process for:', email);

        try {
            // Generate username from email (part before @)
            const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

            // STEP 1: Create Supabase Auth account
            console.log('📝 Creating Supabase Auth account...');
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        role: profile.role,
                        business_id: profile.business_id || null,
                        username: username,
                        display_name: `${profile.first_name} ${profile.last_name}`,
                        is_available_for_work: true,
                        public_profile: true
                    }
                }
            });

            if (authError) {
                console.error('❌ Auth signup error:', authError);
                throw authError;
            }

            if (!authData.user) {
                throw new Error('No user data returned from signup');
            }

            console.log('✅ Supabase Auth account created');

            // STEP 2: Provision Google Workspace account
            // TEMPORARILY DISABLED - googleapis can't run in browser, needs server-side implementation
            console.log('⏭️  Skipping Google Workspace provisioning (needs server-side setup)');
            /*
            console.log('🔄 Provisioning Google Workspace account...');
            const workspaceResult = await provisionWorkspaceAccount({
                firstName: profile.first_name,
                lastName: profile.last_name,
                personalEmail: email,
                firebaseUid: authData.user.id,
            });

            if (workspaceResult.success && workspaceResult.workspaceEmail) {
                console.log('✅ Workspace account created:', workspaceResult.workspaceEmail);
                
                // STEP 3: Update profile with workspace email
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ workspace_email: workspaceResult.workspaceEmail })
                    .eq('id', authData.user.id);

                if (updateError) {
                    console.error('⚠️ Failed to save workspace email to profile:', updateError);
                    // Don't fail signup if this fails - workspace account was created
                }

                console.log('✅ Signup complete! User has:');
                console.log('   - Personal email:', email);
                console.log('   - Workspace email:', workspaceResult.workspaceEmail);
                console.log('   - Temp password for Workspace:', workspaceResult.tempPassword);
                
                // TODO: Send welcome email with workspace credentials
                // await sendWelcomeEmail(email, workspaceResult.workspaceEmail, workspaceResult.tempPassword);
                
            } else {
                console.warn('⚠️ Workspace provisioning failed:', workspaceResult.error);
                console.warn('   User can still use the app, but won\'t have Workspace account');
                // Don't fail the entire signup - user can still use the app
            }
            */

            console.log('✅ Signup process completed successfully');

        } catch (error: any) {
            console.error('❌ Signup process error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        if (!supabase) {
            throw new Error('Supabase not configured');
        }

        const { error } = await supabase.auth.signOut();
        if (error) {
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        if (!supabase) {
            throw new Error('Supabase not configured');
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
            throw error;
        }
    };

    const hasRole = (roles: UserRole[]): boolean => {
        if (!userProfile) return false;
        return roles.includes(userProfile.role);
    };

    const isAdmin = (): boolean => {
        return userProfile?.role === 'admin' || false;
    };

    const value = {
        user,
        userProfile,
        session,
        loading,
        error,
        currentContext,
        availableContexts,
        switchContext,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateUserRole,
        hasRole,
        isAdmin,
        canAccessBusinessFeatures,
        canAccessTeamMemberFeatures,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};