import { supabase } from '../supabase';
import { Customer, Project, ProjectStatus, Estimate, Invoice, TeamMember, BusinessMetrics } from '../types/business';

export class SupabaseBusinessService {
    
    // Customers
    async getCustomers(businessId: string): Promise<Customer[]> {
        if (!supabase) throw new Error('Supabase not configured');
        
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('business_id', businessId);
            
        if (error) throw error;
        
        return data?.map(this.transformCustomer) || [];
    }
    
    async addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>, businessId: string): Promise<string> {
        if (!supabase) throw new Error('Supabase not configured');
        
        const { data, error } = await supabase
            .from('customers')
            .insert({
                business_id: businessId,
                first_name: customer.firstName,
                last_name: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                communication_preferences: customer.communicationPreferences,
                source: customer.source,
                tags: customer.tags,
                notes: customer.notes,
                total_spent: customer.totalSpent,
                project_count: customer.projectCount
            })
            .select()
            .single();
            
        if (error) throw error;
        return data.id;
    }

    async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { businessId: string }): Promise<Customer> {
        if (!supabase) throw new Error('Supabase not configured');
        
        console.log('Creating customer in Supabase:', customer);
        
        const { data, error } = await supabase
            .from('customers')
            .insert({
                business_id: customer.businessId,
                first_name: customer.firstName,
                last_name: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                communication_preferences: customer.communicationPreferences || { email: true, sms: false, phone: false },
                source: customer.source || '',
                tags: customer.tags || [],
                notes: customer.notes || '',
                total_spent: customer.totalSpent || 0,
                project_count: customer.projectCount || 0
            })
            .select()
            .single();
            
        if (error) {
            console.error('Supabase error creating customer:', error);
            throw new Error(`Database error: ${error.message}`);
        }
        
        console.log('Customer created successfully:', data);
        return this.transformCustomer(data);
    }
    
    async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<void> {
        if (!supabase) throw new Error('Supabase not configured');
        
        const updateData: any = {};
        if (updates.firstName) updateData.first_name = updates.firstName;
        if (updates.lastName) updateData.last_name = updates.lastName;
        if (updates.email) updateData.email = updates.email;
        if (updates.phone) updateData.phone = updates.phone;
        if (updates.address) updateData.address = updates.address;
        if (updates.communicationPreferences) updateData.communication_preferences = updates.communicationPreferences;
        if (updates.source) updateData.source = updates.source;
        if (updates.tags) updateData.tags = updates.tags;
        if (updates.notes) updateData.notes = updates.notes;
        if (updates.totalSpent !== undefined) updateData.total_spent = updates.totalSpent;
        if (updates.projectCount !== undefined) updateData.project_count = updates.projectCount;
        
        const { error } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', customerId);
            
        if (error) throw error;
    }

    async deleteCustomer(customerId: string): Promise<void> {
        if (!supabase) throw new Error('Supabase not configured');
        
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', customerId);
            
        if (error) throw error;
    }
    
    // Projects
    async getProjects(businessId: string): Promise<Project[]> {
        if (!supabase) throw new Error('Supabase not configured');
        
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('business_id', businessId);
            
        if (error) throw error;
        
        return data?.map(this.transformProject) || [];
    }
    
    async addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, businessId: string): Promise<string> {
        if (!supabase) throw new Error('Supabase not configured');
        
        const { data, error } = await supabase
            .from('projects')
            .insert({
                business_id: businessId,
                customer_id: project.customerId,
                name: project.name,
                title: project.title,
                description: project.description,
                status: project.status,
                priority: project.priority,
                category: project.category,
                location: project.location,
                estimated_duration: project.estimatedDuration,
                scheduled_date: project.scheduledDate?.toISOString(),
                start_date: project.startDate?.toISOString(),
                completed_date: project.completedDate?.toISOString(),
                photos: project.photos || [],
                notes: project.notes || [],
                tasks: project.tasks || [],
                payments: project.payments || [],
                assigned_team: project.assignedTeam || [],
                materials: project.materials || [],
                permits: project.permits || [],
                inspections: project.inspections || [],
                warranties: project.warranties || [],
                milestones: project.milestones || []
            })
            .select()
            .single();
            
        if (error) throw error;
        return data.id;
    }
    
    // Estimates
    async getEstimates(businessId: string): Promise<Estimate[]> {
        if (!supabase) throw new Error('Supabase not configured');
        
        const { data, error } = await supabase
            .from('estimates')
            .select('*')
            .eq('business_id', businessId);
            
        if (error) throw error;
        
        return data?.map(this.transformEstimate) || [];
    }

    async createEstimate(estimate: Omit<Estimate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Estimate> {
        if (!supabase) throw new Error('Supabase not configured');
        
        console.log('Creating estimate in Supabase:', estimate);
        
        const { data, error } = await supabase
            .from('estimates')
            .insert({
                business_id: estimate.businessId,
                customer_id: estimate.customerId,
                project_id: estimate.projectId,
                estimate_number: estimate.estimateNumber,
                title: estimate.title,
                description: estimate.description,
                items: estimate.items,
                subtotal: estimate.subtotal,
                tax_rate: estimate.taxRate,
                tax_amount: estimate.taxAmount,
                total: estimate.total,
                status: estimate.status,
                valid_until: estimate.validUntil,
                notes: estimate.notes,
                terms: estimate.terms
            })
            .select()
            .single();
            
        if (error) {
            console.error('Supabase error creating estimate:', error);
            throw new Error(`Database error: ${error.message}`);
        }
        
        console.log('Estimate created successfully:', data);
        return this.transformEstimate(data);
    }

    async updateEstimate(id: string, estimate: Partial<Estimate>): Promise<Estimate> {
        if (!supabase) throw new Error('Supabase not configured');
        
        const { data, error } = await supabase
            .from('estimates')
            .update({
                customer_id: estimate.customerId,
                project_id: estimate.projectId,
                estimate_number: estimate.estimateNumber,
                title: estimate.title,
                description: estimate.description,
                items: estimate.items,
                subtotal: estimate.subtotal,
                tax_rate: estimate.taxRate,
                tax_amount: estimate.taxAmount,
                total: estimate.total,
                status: estimate.status,
                valid_until: estimate.validUntil,
                notes: estimate.notes,
                terms: estimate.terms
            })
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        return this.transformEstimate(data);
    }

    async convertEstimateToInvoice(businessId: string, estimateId: string): Promise<Invoice> {
        if (!supabase) throw new Error('Supabase not configured');
        
        // First get the estimate
        const { data: estimate, error: estimateError } = await supabase
            .from('estimates')
            .select('*')
            .eq('id', estimateId)
            .single();
            
        if (estimateError) throw estimateError;
        
        // Create invoice from estimate
        const { data, error } = await supabase
            .from('invoices')
            .insert({
                business_id: businessId,
                customer_id: estimate.customer_id,
                project_id: estimate.project_id,
                estimate_id: estimateId,
                invoice_number: `INV-${Date.now()}`,
                title: estimate.title,
                description: estimate.description,
                items: estimate.items,
                subtotal: estimate.subtotal,
                tax_rate: estimate.tax_rate,
                tax_amount: estimate.tax_amount,
                total: estimate.total,
                status: 'draft',
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
                notes: estimate.notes,
                terms: estimate.terms
            })
            .select()
            .single();
            
        if (error) throw error;
        return this.transformInvoice(data);
    }

    async deleteEstimate(businessId: string, estimateId: string): Promise<void> {
        if (!supabase) throw new Error('Supabase not configured');
        
        const { error } = await supabase
            .from('estimates')
            .delete()
            .eq('id', estimateId)
            .eq('business_id', businessId);
            
        if (error) throw error;
    }
    
    // Invoices  
    async getInvoices(businessId: string): Promise<Invoice[]> {
        if (!supabase) throw new Error('Supabase not configured');
        
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('business_id', businessId);
            
        if (error) throw error;
        
        return data?.map(this.transformInvoice) || [];
    }

    async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
        if (!supabase) throw new Error('Supabase not configured');
        
        const { data, error } = await supabase
            .from('invoices')
            .update({
                customer_id: invoice.customerId,
                project_id: invoice.projectId,
                invoice_number: invoice.invoiceNumber,
                title: invoice.title,
                description: invoice.description,
                items: invoice.items,
                subtotal: invoice.subtotal,
                tax_rate: invoice.taxRate,
                tax_amount: invoice.taxAmount,
                total: invoice.total,
                amount_paid: invoice.amountPaid,
                status: invoice.status,
                due_date: invoice.dueDate,
                paid_date: invoice.paidDate,
                notes: invoice.notes,
                terms: invoice.terms
            })
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        return this.transformInvoice(data);
    }
    
    // Team Members
    async getTeamMembers(businessId: string): Promise<TeamMember[]> {
        if (!supabase) throw new Error('Supabase not configured');
        
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .eq('business_id', businessId);
            
        if (error) throw error;
        
        return data?.map(this.transformTeamMember) || [];
    }

    async createTeamMember(teamMember: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamMember> {
        if (!supabase) throw new Error('Supabase not configured');
        
        const { data, error } = await supabase
            .from('team_members')
            .insert({
                business_id: teamMember.businessId,
                first_name: teamMember.firstName,
                last_name: teamMember.lastName,
                email: teamMember.email,
                phone: teamMember.phone,
                role: teamMember.role,
                department: teamMember.department,
                hire_date: teamMember.hireDate,
                hourly_rate: teamMember.hourlyRate,
                skills: teamMember.skills,
                certifications: teamMember.certifications,
                emergency_contact: teamMember.emergencyContact,
                is_active: teamMember.isActive
            })
            .select()
            .single();
            
        if (error) throw error;
        return this.transformTeamMember(data);
    }

    async updateTeamMember(id: string, teamMember: Partial<TeamMember>): Promise<TeamMember> {
        if (!supabase) throw new Error('Supabase not configured');
        
        const { data, error } = await supabase
            .from('team_members')
            .update({
                first_name: teamMember.firstName,
                last_name: teamMember.lastName,
                email: teamMember.email,
                phone: teamMember.phone,
                role: teamMember.role,
                department: teamMember.department,
                hire_date: teamMember.hireDate,
                hourly_rate: teamMember.hourlyRate,
                skills: teamMember.skills,
                certifications: teamMember.certifications,
                emergency_contact: teamMember.emergencyContact,
                is_active: teamMember.isActive
            })
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        return this.transformTeamMember(data);
    }

    async deleteTeamMember(id: string): Promise<void> {
        if (!supabase) throw new Error('Supabase not configured');
        
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
    }
    
    // Transform functions to convert Supabase data to app interfaces
    private transformCustomer(data: any): Customer {
        return {
            id: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            projects: [], // Will be populated separately if needed
            communicationPreferences: data.communication_preferences,
            source: data.source,
            tags: data.tags || [],
            lastContactDate: data.last_contact_date ? new Date(data.last_contact_date) : undefined,
            totalSpent: data.total_spent || 0,
            projectCount: data.project_count || 0,
            notes: data.notes || '',
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        };
    }
    
    private transformProject(data: any): Project {
        return {
            id: data.id,
            name: data.name,
            customerId: data.customer_id,
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            category: data.category,
            estimateId: data.estimate_id,
            designId: data.design_id,
            location: data.location,
            scheduledDate: data.scheduled_date ? new Date(data.scheduled_date) : undefined,
            startDate: data.start_date ? new Date(data.start_date) : undefined,
            estimatedDuration: data.estimated_duration,
            completedDate: data.completed_date ? new Date(data.completed_date) : undefined,
            photos: data.photos || [],
            notes: data.notes || [],
            tasks: data.tasks || [],
            payments: data.payments || [],
            assignedTeam: data.assigned_team || [],
            materials: data.materials || [],
            permits: data.permits || [],
            inspections: data.inspections || [],
            warranties: data.warranties || [],
            milestones: data.milestones || [],
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        };
    }
    
    private transformEstimate(data: any): Estimate {
        return {
            id: data.id,
            businessId: data.business_id,
            projectId: data.project_id,
            customerId: data.customer_id,
            estimateNumber: data.estimate_number,
            title: data.title,
            description: data.description,
            items: data.items || [],
            subtotal: data.subtotal,
            taxRate: data.tax_rate,
            taxAmount: data.tax_amount,
            total: data.total,
            status: data.status,
            validUntil: data.valid_until ? new Date(data.valid_until) : undefined,
            notes: data.notes || '',
            terms: data.terms || '',
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        };
    }
    
    private transformInvoice(data: any): Invoice {
        return {
            id: data.id,
            businessId: data.business_id,
            projectId: data.project_id,
            customerId: data.customer_id,
            estimateId: data.estimate_id,
            invoiceNumber: data.invoice_number,
            title: data.title,
            description: data.description,
            items: data.items || [],
            subtotal: data.subtotal,
            taxRate: data.tax_rate,
            taxAmount: data.tax_amount,
            total: data.total,
            amountPaid: data.amount_paid || 0,
            status: data.status,
            dueDate: data.due_date ? new Date(data.due_date) : undefined,
            paidDate: data.paid_date ? new Date(data.paid_date) : undefined,
            notes: data.notes || '',
            terms: data.terms || '',
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        };
    }
    
    private transformTeamMember(data: any): TeamMember {
        return {
            id: data.id,
            businessId: data.business_id,
            profileId: data.profile_id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phone: data.phone,
            role: data.role,
            department: data.department,
            hireDate: data.hire_date ? new Date(data.hire_date) : undefined,
            hourlyRate: data.hourly_rate,
            skills: data.skills || [],
            certifications: data.certifications || [],
            emergencyContact: data.emergency_contact,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        };
    }
}

// Export singleton instance
export const supabaseBusinessService = new SupabaseBusinessService();