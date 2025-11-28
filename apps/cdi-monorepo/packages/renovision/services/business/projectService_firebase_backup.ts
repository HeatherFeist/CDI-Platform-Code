import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    getDocs, 
    orderBy,
    increment,
    arrayUnion,
    QueryConstraint,
    limit as limitQuery,
    Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Project, ProjectStatus, PhotoDocument, Note, Task } from '../../types/business';

export class ProjectService {
    private get projectsCollection() {
        if (!db) throw new Error('Firebase is not initialized');
        return collection(db, 'projects');
    }

    async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const timestamp = new Date();
        const docRef = await addDoc(this.projectsCollection, {
            ...projectData,
            status: ProjectStatus.INQUIRY,
            createdAt: timestamp,
            updatedAt: timestamp
        });
        return docRef.id;
    }

    async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
        const projectRef = doc(this.projectsCollection, projectId);
        await updateDoc(projectRef, {
            ...updates,
            updatedAt: new Date()
        });
    }

    async deleteProject(projectId: string): Promise<void> {
        await deleteDoc(doc(this.projectsCollection, projectId));
    }

    async getProject(projectId: string): Promise<Project | null> {
        const docSnap = await getDocs(query(this.projectsCollection, where('id', '==', projectId)));
        if (docSnap.empty) return null;
        return docSnap.docs[0].data() as Project;
    }

    async getProjectsByCustomer(customerId: string): Promise<Project[]> {
        const q = query(
            this.projectsCollection,
            where('customerId', '==', customerId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    }

    async getProjectsByStatus(status: ProjectStatus): Promise<Project[]> {
        const q = query(
            this.projectsCollection,
            where('status', '==', status),
            orderBy('updatedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    }

    async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
        const projectRef = doc(this.projectsCollection, projectId);
        await updateDoc(projectRef, {
            status,
            updatedAt: new Date()
        });
    }

    async addProjectPhoto(projectId: string, photo: PhotoDocument): Promise<void> {
        const projectRef = doc(this.projectsCollection, projectId);
        await updateDoc(projectRef, {
            photos: arrayUnion(photo),
            updatedAt: new Date()
        });
    }

    async addProjectNote(projectId: string, note: Note): Promise<void> {
        const projectRef = doc(this.projectsCollection, projectId);
        await updateDoc(projectRef, {
            notes: arrayUnion({
                ...note,
                timestamp: new Date()
            }),
            updatedAt: new Date()
        });
    }

    async addProjectTask(projectId: string, task: Task): Promise<void> {
        const projectRef = doc(this.projectsCollection, projectId);
        await updateDoc(projectRef, {
            tasks: arrayUnion({
                ...task,
                status: 'pending',
                createdAt: new Date()
            }),
            updatedAt: new Date()
        });
    }

    async updateProjectTask(projectId: string, taskId: string, updates: Partial<Task>): Promise<void> {
        const projectRef = doc(this.projectsCollection, projectId);
        const project = (await getDocs(query(this.projectsCollection, where('id', '==', projectId)))).docs[0].data() as Project;
        
        const updatedTasks = project.tasks.map(task => 
            task.id === taskId ? { ...task, ...updates, updatedAt: new Date() } : task
        );

        await updateDoc(projectRef, {
            tasks: updatedTasks,
            updatedAt: new Date()
        });
    }

    async addMaterial(
        projectId: string, 
        material: { item: string; quantity: number; cost: number; }
    ): Promise<void> {
        const projectRef = doc(this.projectsCollection, projectId);
        await updateDoc(projectRef, {
            materials: arrayUnion({
                ...material,
                ordered: false,
                received: false
            }),
            updatedAt: new Date()
        });
    }

    async updateMaterialStatus(
        projectId: string,
        materialItem: string,
        updates: { ordered?: boolean; received?: boolean }
    ): Promise<void> {
        const projectRef = doc(this.projectsCollection, projectId);
        const project = (await getDocs(query(this.projectsCollection, where('id', '==', projectId)))).docs[0].data() as Project;
        
        const updatedMaterials = project.materials.map(material => 
            material.item === materialItem ? { ...material, ...updates } : material
        );

        await updateDoc(projectRef, {
            materials: updatedMaterials,
            updatedAt: new Date()
        });
    }

    async addPermit(
        projectId: string,
        permit: { type: string; submissionDate: Date; }
    ): Promise<void> {
        const projectRef = doc(this.projectsCollection, projectId);
        await updateDoc(projectRef, {
            permits: arrayUnion({
                ...permit,
                status: 'pending'
            }),
            updatedAt: new Date()
        });
    }

    async updatePermitStatus(
        projectId: string,
        permitType: string,
        status: 'approved' | 'rejected',
        approvalDate?: Date
    ): Promise<void> {
        const projectRef = doc(this.projectsCollection, projectId);
        const project = (await getDocs(query(this.projectsCollection, where('id', '==', projectId)))).docs[0].data() as Project;
        
        const updatedPermits = project.permits.map(permit => 
            permit.type === permitType ? { ...permit, status, approvalDate } : permit
        );

        await updateDoc(projectRef, {
            permits: updatedPermits,
            updatedAt: new Date()
        });
    }

    async addInspection(
        projectId: string,
        inspection: { type: string; notes: string; }
    ): Promise<void> {
        const projectRef = doc(this.projectsCollection, projectId);
        await updateDoc(projectRef, {
            inspections: arrayUnion({
                ...inspection,
                passed: false
            }),
            updatedAt: new Date()
        });
    }

    async updateInspectionStatus(
        projectId: string,
        inspectionType: string,
        passed: boolean,
        date: Date
    ): Promise<void> {
        const projectRef = doc(this.projectsCollection, projectId);
        const project = (await getDocs(query(this.projectsCollection, where('id', '==', projectId)))).docs[0].data() as Project;
        
        const updatedInspections = project.inspections.map(inspection => 
            inspection.type === inspectionType ? { ...inspection, passed, date } : inspection
        );

        await updateDoc(projectRef, {
            inspections: updatedInspections,
            updatedAt: new Date()
        });
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
        const projectRef = doc(this.projectsCollection, projectId);
        await updateDoc(projectRef, {
            warranties: arrayUnion(warranty),
            updatedAt: new Date()
        });
    }

    async addMilestone(
        projectId: string,
        milestone: {
            title: string;
            date?: Date;
        }
    ): Promise<void> {
        const projectRef = doc(this.projectsCollection, projectId);
        await updateDoc(projectRef, {
            milestones: arrayUnion({
                ...milestone,
                completed: false
            }),
            updatedAt: new Date()
        });
    }

    async completeMilestone(
        projectId: string,
        milestoneTitle: string,
        date: Date
    ): Promise<void> {
        const projectRef = doc(this.projectsCollection, projectId);
        const project = (await getDocs(query(this.projectsCollection, where('id', '==', projectId)))).docs[0].data() as Project;
        
        const updatedMilestones = project.milestones.map(milestone => 
            milestone.title === milestoneTitle ? { ...milestone, completed: true, date } : milestone
        );

        await updateDoc(projectRef, {
            milestones: updatedMilestones,
            updatedAt: new Date()
        });
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
        const projectRef = doc(this.projectsCollection, projectId);
        await updateDoc(projectRef, {
            ...updates,
            updatedAt: new Date()
        });
    }
}