import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { businessService } from '../services/businessService';
import { Customer, Project, TeamMember, BusinessMetrics } from '../types/business';

interface BusinessContextType {
    customers: Customer[];
    projects: Project[];
    teamMembers: TeamMember[];
    metrics: BusinessMetrics | null;
    isLoading: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
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
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        if (!auth.currentUser) {
            setError("You must be logged in to access business data.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const [
                fetchedCustomers,
                fetchedProjects,
                fetchedTeamMembers,
                fetchedMetrics
            ] = await Promise.all([
                businessService.getCustomers(),
                businessService.getProjects(),
                businessService.getTeamMembers(),
                businessService.getBusinessMetrics()
            ]);

            setCustomers(fetchedCustomers);
            setProjects(fetchedProjects);
            setTeamMembers(fetchedTeamMembers);
            setMetrics(fetchedMetrics);
        } catch (err) {
            console.error('Error fetching business data:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial data fetch when the user logs in
    useEffect(() => {
        if (!auth) {
            setIsLoading(false);
            return;
        }

        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                fetchData();
            } else {
                setCustomers([]);
                setProjects([]);
                setTeamMembers([]);
                setMetrics(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const value = {
        customers,
        projects,
        teamMembers,
        metrics,
        isLoading,
        error,
        refreshData: fetchData
    };

    return (
        <BusinessContext.Provider value={value}>
            {children}
        </BusinessContext.Provider>
    );
};