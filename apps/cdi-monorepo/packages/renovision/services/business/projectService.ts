import { supabase } from '../../supabase';
import { Project, ProjectStatus, PhotoDocument, Note, Task } from '../../types/business';

export class ProjectService {
    async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'business_id' | 'customer_id'> & { businessId: string; customerId: string }): Promise<string> {
        const timestamp = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('projects')
            .insert({
                business_id: projectData.businessId,
                customer_id: projectData.customerId,
                name: projectData.name,
                title: projectData.title,
                description: projectData.description,
                status: ProjectStatus.INQUIRY,
                priority: projectData.priority || 'medium',
                category: projectData.category,
                estimate_id: projectData.estimateId,
                design_id: projectData.designId,
                location: projectData.location,
                scheduled_date: projectData.scheduledDate,
                start_date: projectData.startDate,
                estimated_duration: projectData.estimatedDuration,
                completed_date: projectData.completedDate,
                photos: projectData.photos || [],
                notes: projectData.notes || [],
                tasks: projectData.tasks || [],
                payments: projectData.payments || [],
                assigned_team: projectData.assignedTeam || [],
                materials: projectData.materials || [],
                permits: projectData.permits || [],
                inspections: projectData.inspections || [],
                warranties: projectData.warranties || [],
                milestones: projectData.milestones || [],
                created_at: timestamp,
                updated_at: timestamp
            })
            .select('id')
            .single();

        if (error) throw error;
        if (!data) throw new Error('Failed to create project');
        
        return data.id;
    }

    async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
        const mappedUpdates: any = {
            updated_at: new Date().toISOString()
        };

        // Map camelCase to snake_case
        if ((updates as any).businessId !== undefined) mappedUpdates.business_id = (updates as any).businessId;
        if ((updates as any).customerId !== undefined) mappedUpdates.customer_id = (updates as any).customerId;
        if (updates.name !== undefined) mappedUpdates.name = updates.name;
        if (updates.title !== undefined) mappedUpdates.title = updates.title;
        if (updates.description !== undefined) mappedUpdates.description = updates.description;
        if (updates.status !== undefined) mappedUpdates.status = updates.status;
        if (updates.priority !== undefined) mappedUpdates.priority = updates.priority;
        if (updates.category !== undefined) mappedUpdates.category = updates.category;
        if ((updates as any).estimateId !== undefined) mappedUpdates.estimate_id = (updates as any).estimateId;
        if ((updates as any).designId !== undefined) mappedUpdates.design_id = (updates as any).designId;
        if (updates.location !== undefined) mappedUpdates.location = updates.location;
        if ((updates as any).scheduledDate !== undefined) mappedUpdates.scheduled_date = (updates as any).scheduledDate;
        if ((updates as any).startDate !== undefined) mappedUpdates.start_date = (updates as any).startDate;
        if ((updates as any).estimatedDuration !== undefined) mappedUpdates.estimated_duration = (updates as any).estimatedDuration;
        if ((updates as any).completedDate !== undefined) mappedUpdates.completed_date = (updates as any).completedDate;
        if (updates.photos !== undefined) mappedUpdates.photos = updates.photos;
        if (updates.notes !== undefined) mappedUpdates.notes = updates.notes;
        if (updates.tasks !== undefined) mappedUpdates.tasks = updates.tasks;
        if (updates.payments !== undefined) mappedUpdates.payments = updates.payments;
        if ((updates as any).assignedTeam !== undefined) mappedUpdates.assigned_team = (updates as any).assignedTeam;
        if (updates.materials !== undefined) mappedUpdates.materials = updates.materials;
        if (updates.permits !== undefined) mappedUpdates.permits = updates.permits;
        if (updates.inspections !== undefined) mappedUpdates.inspections = updates.inspections;
        if (updates.warranties !== undefined) mappedUpdates.warranties = updates.warranties;
        if (updates.milestones !== undefined) mappedUpdates.milestones = updates.milestones;

        const { error } = await supabase
            .from('projects')
            .update(mappedUpdates)
            .eq('id', projectId);

        if (error) throw error;
    }

    async deleteProject(projectId: string): Promise<void> {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;
    }

    async getProject(projectId: string): Promise<Project | null> {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }

        return this.mapToProject(data);
    }

    async getProjectsByCustomer(customerId: string): Promise<Project[]> {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data?.map(this.mapToProject) || [];
    }

    async getProjectsByStatus(status: ProjectStatus): Promise<Project[]> {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('status', status)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        
        return data?.map(this.mapToProject) || [];
    }

    async getBusinessProjects(businessId: string): Promise<Project[]> {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data?.map(this.mapToProject) || [];
    }

    async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
        const { error } = await supabase
            .from('projects')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', projectId);

        if (error) throw error;
    }

    async addProjectPhoto(projectId: string, photo: PhotoDocument): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) throw new Error('Project not found');

        const updatedPhotos = [...(project.photos || []), photo];
        
        await this.updateProject(projectId, { photos: updatedPhotos });
    }

    async addProjectNote(projectId: string, note: Note): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) throw new Error('Project not found');

        const updatedNotes = [...(project.notes || []), {
            ...note,
            timestamp: new Date()
        }];
        
        await this.updateProject(projectId, { notes: updatedNotes });
    }

    async addProjectTask(projectId: string, task: Task): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) throw new Error('Project not found');

        const updatedTasks: Task[] = [
            ...(project.tasks || []),
            {
                ...task,
                status: 'pending' as Task['status'],
                createdAt: new Date()
            } as Task
        ];
        
        await this.updateProject(projectId, { tasks: updatedTasks });
    }

    async updateProjectTask(projectId: string, taskId: string, updates: Partial<Task>): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) throw new Error('Project not found');
        
        const updatedTasks = (project.tasks || []).map(task => 
            task.id === taskId ? { ...task, ...updates, updatedAt: new Date() } : task
        );

        await this.updateProject(projectId, { tasks: updatedTasks });
    }

    async addMaterial(
        projectId: string, 
        material: { item: string; quantity: number; cost: number; }
    ): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) throw new Error('Project not found');

        const updatedMaterials = [...(project.materials || []), {
            ...material,
            ordered: false,
            received: false
        }];
        
        await this.updateProject(projectId, { materials: updatedMaterials });
    }

    async updateMaterialStatus(
        projectId: string,
        materialItem: string,
        updates: { ordered?: boolean; received?: boolean }
    ): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) throw new Error('Project not found');
        
        const updatedMaterials = (project.materials || []).map(material => 
            material.item === materialItem ? { ...material, ...updates } : material
        );

        await this.updateProject(projectId, { materials: updatedMaterials });
    }

    async addPermit(
        projectId: string,
        permit: { type: string; submissionDate: Date; }
    ): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) throw new Error('Project not found');

        const updatedPermits = [
            ...((project.permits || []).map(p => ({
                ...p,
                status: p.status as "pending" | "approved" | "rejected"
            }))),
            {
                ...permit,
                status: 'pending' as "pending"
            }
        ];
        
        await this.updateProject(projectId, { permits: updatedPermits });
    }

    async updatePermitStatus(
        projectId: string,
        permitType: string,
        status: 'approved' | 'rejected',
        approvalDate?: Date
    ): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) throw new Error('Project not found');
        
        const updatedPermits = (project.permits || []).map(permit => 
            permit.type === permitType ? { ...permit, status, approvalDate } : permit
        );

        await this.updateProject(projectId, { permits: updatedPermits });
    }

    async addInspection(
        projectId: string,
        inspection: { type: string; notes: string; }
    ): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) throw new Error('Project not found');

        const updatedInspections = [...(project.inspections || []), {
            ...inspection,
            passed: false
        }];
        
        await this.updateProject(projectId, { inspections: updatedInspections });
    }

    async updateInspectionStatus(
        projectId: string,
        inspectionType: string,
        passed: boolean,
        date: Date
    ): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) throw new Error('Project not found');
        
        const updatedInspections = (project.inspections || []).map(inspection => 
            inspection.type === inspectionType ? { ...inspection, passed, date } : inspection
        );

        await this.updateProject(projectId, { inspections: updatedInspections });
    }

    async addWarranty(
        projectId: string,
        warranty: { 
            type: string;
            provider: string;
            startDate: Date;
            endDate: Date;
            documentUrl?: string;
        }
    ): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) throw new Error('Project not found');

        const updatedWarranties = [...(project.warranties || []), warranty];
        
        await this.updateProject(projectId, { warranties: updatedWarranties });
    }

    async addMilestone(
        projectId: string,
        milestone: {
            title: string;
            date?: Date;
        }
    ): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) throw new Error('Project not found');

        const updatedMilestones = [...(project.milestones || []), {
            ...milestone,
            completed: false
        }];
        
        await this.updateProject(projectId, { milestones: updatedMilestones });
    }

    async completeMilestone(
        projectId: string,
        milestoneTitle: string,
        date: Date
    ): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) throw new Error('Project not found');
        
        const updatedMilestones = (project.milestones || []).map(milestone => 
            milestone.title === milestoneTitle ? { ...milestone, completed: true, date } : milestone
        );

        await this.updateProject(projectId, { milestones: updatedMilestones });
    }

    // Timeline tracking
    async updateProjectTimeline(
        projectId: string, 
        updates: { 
            startDate?: Date;
            estimatedDuration?: number;
            completedDate?: Date;
        }
    ): Promise<void> {
        await this.updateProject(projectId, {
            startDate: updates.startDate,
            estimatedDuration: updates.estimatedDuration,
            completedDate: updates.completedDate
        });
    }

    private mapToProject(data: any): Project {
        return {
            id: data.id,
            business_id: data.business_id,
            customer_id: data.customer_id,
            name: data.name,
            title: data.title,
            description: data.description,
            status: data.status as ProjectStatus,
            priority: data.priority,
            category: data.category,
            estimate_id: data.estimate_id,
            design_id: data.design_id,
            location: data.location,
            scheduled_date: data.scheduled_date ? new Date(data.scheduled_date) : undefined,
            start_date: data.start_date ? new Date(data.start_date) : undefined,
            estimated_duration: data.estimated_duration,
            completed_date: data.completed_date ? new Date(data.completed_date) : undefined,
            photos: data.photos || [],
            notes: data.notes || [],
            tasks: data.tasks || [],
            payments: data.payments || [],
            assigned_team: data.assigned_team || [],
            materials: data.materials || [],
            permits: data.permits || [],
            inspections: data.inspections || [],
            warranties: data.warranties || [],
            milestones: data.milestones || [],
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at)
        };
    }
}

export const projectService = new ProjectService();
