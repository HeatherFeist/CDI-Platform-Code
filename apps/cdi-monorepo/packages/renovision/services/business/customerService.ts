import { supabase } from '../../supabase';
import { Customer, Address } from '../../types/business';

export class CustomerService {
    async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { businessId: string }): Promise<string> {
        const timestamp = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('customers')
            .insert({
                business_id: customerData.businessId,
                first_name: customerData.firstName,
                last_name: customerData.lastName,
                email: customerData.email,
                phone: customerData.phone,
                address: customerData.address,
                communication_preferences: customerData.communicationPreferences,
                source: customerData.source || '',
                tags: customerData.tags || [],
                last_contact_date: customerData.lastContactDate,
                notes: customerData.notes || '',
                total_spent: 0,
                project_count: 0,
                created_at: timestamp,
                updated_at: timestamp
            })
            .select('id')
            .single();

        if (error) throw error;
        if (!data) throw new Error('Failed to create customer');
        
        return data.id;
    }

    async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<void> {
        const mappedUpdates: any = {
            updated_at: new Date().toISOString()
        };

        // Map camelCase to snake_case
        if ((updates as any).businessId !== undefined) mappedUpdates.business_id = (updates as any).businessId;
        if ((updates as any).firstName !== undefined) mappedUpdates.first_name = (updates as any).firstName;
        if ((updates as any).lastName !== undefined) mappedUpdates.last_name = (updates as any).lastName;
        if (updates.email !== undefined) mappedUpdates.email = updates.email;
        if (updates.phone !== undefined) mappedUpdates.phone = updates.phone;
        if (updates.address !== undefined) mappedUpdates.address = updates.address;
        if ((updates as any).communicationPreferences !== undefined) mappedUpdates.communication_preferences = (updates as any).communicationPreferences;
        if ((updates as any).source !== undefined) mappedUpdates.source = (updates as any).source;
        if ((updates as any).tags !== undefined) mappedUpdates.tags = (updates as any).tags;
        if ((updates as any).lastContactDate !== undefined) mappedUpdates.last_contact_date = (updates as any).lastContactDate;
        if ((updates as any).totalSpent !== undefined) mappedUpdates.total_spent = (updates as any).totalSpent;
        if ((updates as any).projectCount !== undefined) mappedUpdates.project_count = (updates as any).projectCount;
        if ((updates as any).notes !== undefined) mappedUpdates.notes = (updates as any).notes;

        const { error } = await supabase
            .from('customers')
            .update(mappedUpdates)
            .eq('id', customerId);

        if (error) throw error;
    }

    async deleteCustomer(customerId: string): Promise<void> {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', customerId);

        if (error) throw error;
    }

    async getCustomer(customerId: string): Promise<Customer | null> {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }

        return this.mapToCustomer(data);
    }

    async getBusinessCustomers(businessId: string): Promise<Customer[]> {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data?.map(this.mapToCustomer) || [];
    }

    async searchCustomers(businessId: string, searchTerm: string): Promise<Customer[]> {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('business_id', businessId)
            .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data?.map(this.mapToCustomer) || [];
    }

    async getRecentCustomers(businessId: string, limitCount: number = 10): Promise<Customer[]> {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false })
            .limit(limitCount);

        if (error) throw error;
        
        return data?.map(this.mapToCustomer) || [];
    }

    async incrementProjectCount(customerId: string): Promise<void> {
        const { error } = await supabase.rpc('increment_customer_projects', {
            customer_id: customerId
        });

        if (error) {
            // Fallback if RPC doesn't exist
            const customer = await this.getCustomer(customerId);
            if (customer) {
                await this.updateCustomer(customerId, {
                    projectCount: (customer.projectCount || 0) + 1
                });
            }
        }
    }

    async updateTotalSpent(customerId: string, amount: number): Promise<void> {
        const customer = await this.getCustomer(customerId);
        if (customer) {
            await this.updateCustomer(customerId, {
                totalSpent: (customer.totalSpent || 0) + amount
            });
        }
    }

    private mapToCustomer(data: any): Customer {
        return {
            id: data.id,
            businessId: data.business_id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            communicationPreferences: data.communication_preferences,
            source: data.source || '',
            tags: data.tags || [],
            lastContactDate: data.last_contact_date ? new Date(data.last_contact_date) : undefined,
            totalSpent: parseFloat(data.total_spent || '0'),
            projectCount: data.project_count || 0,
            notes: data.notes || '',
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        };
    }
}

export const customerService = new CustomerService();
