import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isConfigured } from '../supabase';
import { useAuth } from './SupabaseAuthContext';
import { Customer, Project, TeamMember, BusinessMetrics } from '../types/business';
import { SupabaseBusinessService } from '../services/supabaseBusinessService';

const businessService = new SupabaseBusinessService();

interface BusinessContextType {
    businessId: string | null;
    customers: Customer[];
    projects: Project[];
    teamMembers: TeamMember[];
    metrics: BusinessMetrics | null;
    isLoading: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
    deleteCustomer: (customerId: string) => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const useBusinessContext = () => {
    const context = useContext(BusinessContext);
    if (context === undefined) {
        throw new Error('useBusinessContext must be used within a BusinessProvider');
    }
    return context;
};

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Safely get auth context
    let authContext;
    try {
        authContext = useAuth();
    } catch (error) {
        console.error('Auth context not available in BusinessProvider:', error);
        // Return a fallback provider with loading state
        return (
            <BusinessContext.Provider value={{
                businessId: null,
                customers: [],
                projects: [],
                teamMembers: [],
                metrics: null,
                isLoading: true,
                error: 'Authentication not initialized',
                refreshData: async () => {},
                deleteCustomer: async () => {}
            }}>
                {children}
            </BusinessContext.Provider>
        );
    }
    
    const { userProfile, user } = authContext;
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        console.log('BusinessContext: fetchData called');
        console.log('isConfigured:', isConfigured);
        console.log('supabase:', !!supabase);
        console.log('userProfile:', userProfile);
        
        if (!isConfigured || !supabase) {
            console.log('BusinessContext: Supabase not configured');
            setError('Supabase configuration is missing. Please add your Supabase URL and anon key to the .env file.');
            setIsLoading(false);
            return;
        }

        if (!userProfile?.business_id) {
            console.log('BusinessContext: No user profile or business_id');
            // Don't set this as an error - it's a normal state before setup
            setCustomers([]);
            setProjects([]);
            setTeamMembers([]);
            setMetrics(null);
            setError(null); // Clear any previous errors
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const businessId = userProfile.business_id;

            // Fetch customers
            const { data: customersData, error: customersError } = await supabase
                .from('customers')
                .select('*')
                .eq('business_id', businessId);

            if (customersError) throw customersError;

            // Transform Supabase data to match our interface
            const transformedCustomers: Customer[] = customersData?.map(customer => ({
                id: customer.id,
                firstName: customer.first_name,
                lastName: customer.last_name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                projects: [], // Will be populated from projects data
                communicationPreferences: customer.communication_preferences,
                source: customer.source,
                tags: customer.tags || [],
                lastContactDate: customer.last_contact_date ? new Date(customer.last_contact_date) : undefined,
                totalSpent: customer.total_spent,
                projectCount: customer.project_count,
                notes: customer.notes,
                createdAt: new Date(customer.created_at),
                updatedAt: new Date(customer.updated_at)
            })) || [];

            // Fetch projects
            const { data: projectsData, error: projectsError } = await supabase
                .from('projects')
                .select('*')
                .eq('business_id', businessId);

            if (projectsError) throw projectsError;

            const transformedProjects: Project[] = projectsData?.map(project => ({
                id: project.id,
                name: project.name,
                customerId: project.customer_id,
                title: project.title,
                description: project.description,
                status: project.status,
                priority: project.priority,
                category: project.category,
                estimateId: project.estimate_id,
                designId: project.design_id,
                location: project.location,
                scheduledDate: project.scheduled_date ? new Date(project.scheduled_date) : undefined,
                startDate: project.start_date ? new Date(project.start_date) : undefined,
                estimatedDuration: project.estimated_duration,
                completedDate: project.completed_date ? new Date(project.completed_date) : undefined,
                photos: project.photos || [],
                notes: project.notes || [],
                tasks: project.tasks || [],
                payments: project.payments || [],
                assignedTeam: project.assigned_team || [],
                materials: project.materials || [],
                permits: project.permits || [],
                inspections: project.inspections || [],
                warranties: project.warranties || [],
                milestones: project.milestones || [],
                createdAt: new Date(project.created_at),
                updatedAt: new Date(project.updated_at)
            })) || [];

            // Fetch team members
            const { data: teamData, error: teamError } = await supabase
                .from('team_members')
                .select('*')
                .eq('business_id', businessId);

            if (teamError) throw teamError;

            const transformedTeam: TeamMember[] = teamData?.map(member => ({
                id: member.id,
                firstName: member.first_name,
                lastName: member.last_name,
                email: member.email,
                phone: member.phone,
                role: member.role as 'admin' | 'manager' | 'technician' | 'sales',
                specialties: member.skills || [],
                activeProjectIds: [],
                schedule: []
            })) || [];

            // Calculate metrics
            const totalRevenue = transformedProjects
                .filter(p => p.status === 'completed')
                .reduce((sum, p) => sum + (p.payments?.reduce((pSum, payment) => pSum + payment.amount, 0) || 0), 0);

            const activeProjects = transformedProjects.filter(p => 
                ['scheduled', 'in_progress'].includes(p.status)
            ).length;

            const completedProjects = transformedProjects.filter(p => 
                p.status === 'completed'
            ).length;

            const upcomingProjects = transformedProjects.filter(p => 
                p.status === 'scheduled'
            ).length;

            const calculatedMetrics: BusinessMetrics = {
                totalRevenue,
                activeProjects,
                projectsCompleted: completedProjects,
                upcomingProjects,
                averageProjectValue: completedProjects > 0 ? totalRevenue / completedProjects : 0,
                customerSatisfactionScore: 4.5, // Default placeholder
                leadConversionRate: 75, // Default placeholder
            };

            setCustomers(transformedCustomers);
            setProjects(transformedProjects);
            setTeamMembers(transformedTeam);
            setMetrics(calculatedMetrics);

        } catch (err) {
            console.error('Error fetching business data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial data fetch when the user logs in
    useEffect(() => {
        if (user && userProfile) {
            fetchData();
        } else {
            setCustomers([]);
            setProjects([]);
            setTeamMembers([]);
            setMetrics(null);
            setIsLoading(false);
        }
    }, [user, userProfile]);

    const handleDeleteCustomer = async (customerId: string) => {
        await businessService.deleteCustomer(customerId);
        await fetchData(); // Refresh data after deletion
    };

    const value = {
        businessId: userProfile?.business_id || null,
        customers,
        projects,
        teamMembers,
        metrics,
        isLoading,
        error,
        refreshData: fetchData,
        deleteCustomer: handleDeleteCustomer
    };

    return (
        <BusinessContext.Provider value={value}>
            {children}
        </BusinessContext.Provider>
    );
};