import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, orderBy, limit, DocumentData, DocumentReference } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Customer, Project, ProjectStatus, Estimate, Invoice, TeamMember, BusinessMetrics, Note, Task, PhotoDocument, Payment } from '../types/business';

const COLLECTIONS = {
    CUSTOMERS: 'customers',
    PROJECTS: 'projects',
    ESTIMATES: 'estimates',
    INVOICES: 'invoices',
    TEAM: 'team',
    ANALYTICS: 'analytics'
};

export const businessService = {
    // Customer Operations
    async createCustomer(customer: Omit<Customer, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTIONS.CUSTOMERS), {
            ...customer,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    },

    async getCustomer(customerId: string): Promise<Customer> {
        const docRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) throw new Error('Customer not found');
        return { id: docSnap.id, ...docSnap.data() } as Customer;
    },

    async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<void> {
        const docRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date()
        });
    },

    async deleteCustomer(customerId: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, customerId));
    },

    async getCustomers(): Promise<Customer[]> {
        const q = query(
            collection(db, COLLECTIONS.CUSTOMERS),
            orderBy('lastName', 'asc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    },

    // Project Operations
    async createProject(project: Omit<Project, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTIONS.PROJECTS), {
            ...project,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    },

    async getProject(projectId: string): Promise<Project> {
        const docRef = doc(db, COLLECTIONS.PROJECTS, projectId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) throw new Error('Project not found');
        return { id: docSnap.id, ...docSnap.data() } as Project;
    },

    async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
        const docRef = doc(db, COLLECTIONS.PROJECTS, projectId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date()
        });
    },

    async deleteProject(projectId: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTIONS.PROJECTS, projectId));
    },

    async getProjects(status?: ProjectStatus): Promise<Project[]> {
        let q = query(collection(db, COLLECTIONS.PROJECTS));
        if (status) {
            q = query(q, where('status', '==', status));
        }
        q = query(q, orderBy('startDate', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    },

    async getCustomerProjects(customerId: string): Promise<Project[]> {
        const q = query(
            collection(db, COLLECTIONS.PROJECTS),
            where('customerId', '==', customerId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    },

    // Project Nested Collections
    async addProjectNote(projectId: string, note: Omit<Note, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTIONS.PROJECTS, projectId, 'notes'), note);
        return docRef.id;
    },

    async addProjectTask(projectId: string, task: Omit<Task, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTIONS.PROJECTS, projectId, 'tasks'), task);
        return docRef.id;
    },

    async addProjectPhoto(projectId: string, photo: Omit<PhotoDocument, 'id' | 'url'>, imageDataUrl: string): Promise<string> {
        // Upload the image to Firebase Storage
        const storageRef = ref(storage, `projects/${projectId}/photos/${Date.now()}`);
        await uploadString(storageRef, imageDataUrl, 'data_url');
        const url = await getDownloadURL(storageRef);

        // Add the photo document with the storage URL
        const docRef = await addDoc(collection(db, COLLECTIONS.PROJECTS, projectId, 'photos'), {
            ...photo,
            url,
            timestamp: new Date()
        });
        return docRef.id;
    },

    async addProjectPayment(projectId: string, payment: Omit<Payment, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTIONS.PROJECTS, projectId, 'payments'), payment);
        return docRef.id;
    },

    // Estimate Operations
    async createEstimate(estimate: Omit<Estimate, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTIONS.ESTIMATES), {
            ...estimate,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    },

    async getEstimate(estimateId: string): Promise<Estimate> {
        const docRef = doc(db, COLLECTIONS.ESTIMATES, estimateId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) throw new Error('Estimate not found');
        return { id: docSnap.id, ...docSnap.data() } as Estimate;
    },

    async updateEstimate(estimateId: string, updates: Partial<Estimate>): Promise<void> {
        const docRef = doc(db, COLLECTIONS.ESTIMATES, estimateId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date()
        });
    },

    async deleteEstimate(estimateId: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTIONS.ESTIMATES, estimateId));
    },

    async getEstimates(businessId: string): Promise<Estimate[]> {
        const q = query(
            collection(db, COLLECTIONS.ESTIMATES),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Estimate));
    },

    async convertEstimateToInvoice(businessId: string, estimateId: string): Promise<string> {
        const estimate = await this.getEstimate(estimateId);
        const invoice = {
            projectId: estimate.projectId,
            customerId: estimate.customerId,
            items: estimate.items.map(item => ({
                ...item,
                taxable: true
            })),
            subtotal: estimate.subtotal,
            taxes: [],
            total: estimate.total,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            status: 'draft' as const,
            payments: []
        };
        const invoiceId = await this.createInvoice(invoice);
        await this.updateEstimate(estimateId, { approved: true });
        return invoiceId;
    },

    // Invoice Operations
    async createInvoice(invoice: Omit<Invoice, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTIONS.INVOICES), {
            ...invoice,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    },

    async getInvoice(invoiceId: string): Promise<Invoice> {
        const docRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) throw new Error('Invoice not found');
        return { id: docSnap.id, ...docSnap.data() } as Invoice;
    },

    async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<void> {
        const docRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date()
        });
    },

    async deleteInvoice(invoiceId: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTIONS.INVOICES, invoiceId));
    },

    async getInvoices(businessId: string): Promise<Invoice[]> {
        const q = query(
            collection(db, COLLECTIONS.INVOICES),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
    },

    // Team Member Operations
    async createTeamMember(member: Omit<TeamMember, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTIONS.TEAM), {
            ...member,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    },

    async getTeamMember(memberId: string): Promise<TeamMember> {
        const docRef = doc(db, COLLECTIONS.TEAM, memberId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) throw new Error('Team member not found');
        return { id: docSnap.id, ...docSnap.data() } as TeamMember;
    },

    async updateTeamMember(memberId: string, updates: Partial<TeamMember>): Promise<void> {
        const docRef = doc(db, COLLECTIONS.TEAM, memberId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date()
        });
    },

    async deleteTeamMember(memberId: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTIONS.TEAM, memberId));
    },

    async getTeamMembers(): Promise<TeamMember[]> {
        const q = query(
            collection(db, COLLECTIONS.TEAM),
            orderBy('lastName', 'asc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
    },

    // Business Metrics
    async getBusinessMetrics(): Promise<BusinessMetrics> {
        // Get active projects
        const activeQuery = query(
            collection(db, COLLECTIONS.PROJECTS),
            where('status', '==', ProjectStatus.IN_PROGRESS)
        );
        const completedQuery = query(
            collection(db, COLLECTIONS.PROJECTS),
            where('status', '==', ProjectStatus.COMPLETED)
        );

        const [activeSnapshot, completedSnapshot] = await Promise.all([
            getDocs(activeQuery),
            getDocs(completedQuery)
        ]);

        const activeProjects = activeSnapshot.docs.length;
        const projectsCompleted = completedSnapshot.docs.length;

        // Calculate total revenue from completed projects
        const totalRevenue = completedSnapshot.docs.reduce((sum, doc) => {
            const project = doc.data() as Project;
            return sum + (project.payments?.reduce((total, payment) => total + payment.amount, 0) || 0);
        }, 0);

        // Get customer satisfaction (placeholder - would come from reviews/ratings)
        const customerSatisfactionScore = 4.8;

        // Get lead conversion rate (placeholder - would be calculated from leads collection)
        const leadConversionRate = 0.65;

        // Get upcoming projects (scheduled but not started)
        const upcomingQuery = query(
            collection(db, COLLECTIONS.PROJECTS),
            where('status', '==', ProjectStatus.SCHEDULED)
        );
        const upcomingSnapshot = await getDocs(upcomingQuery);
        const upcomingProjects = upcomingSnapshot.docs.length;

        return {
            totalRevenue,
            projectsCompleted,
            averageProjectValue: projectsCompleted > 0 ? totalRevenue / projectsCompleted : 0,
            customerSatisfactionScore,
            leadConversionRate,
            activeProjects,
            upcomingProjects
        };
    }
};