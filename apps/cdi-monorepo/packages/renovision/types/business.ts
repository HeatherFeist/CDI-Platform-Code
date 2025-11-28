export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: Address;
    projects: string[]; // Array of project IDs
    communicationPreferences: {
        email: boolean;
        sms: boolean;
        phone: boolean;
    };
    source: string; // How they found your business
    tags: string[]; // For customer segmentation
    lastContactDate?: Date;
    totalSpent: number;
    projectCount: number;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface Project {
    name: string;
    id: string;
    customerId: string;
    title: string;
    description: string;
    status: ProjectStatus;
    priority: 'low' | 'medium' | 'high';
    category: string;
    estimateId?: string;
    designId?: string;
    location: Address;
    scheduledDate?: Date;
    startDate?: Date;
    estimatedDuration: number; // in days
    completedDate?: Date;
    photos: PhotoDocument[];
    notes: Note[];
    tasks: Task[];
    payments: Payment[];
    assignedTeam: string[]; // Team member IDs
    materials: {
        item: string;
        quantity: number;
        ordered: boolean;
        received: boolean;
        cost: number;
    }[];
    permits: {
        type: string;
        status: 'pending' | 'approved' | 'rejected';
        submissionDate: Date;
        approvalDate?: Date;
        number?: string;
    }[];
    inspections: {
        type: string;
        date?: Date;
        passed: boolean;
        notes: string;
    }[];
    warranties: {
        type: string;
        provider: string;
        startDate: Date;
        endDate: Date;
        documentUrl?: string;
    }[];
    milestones: {
        title: string;
        date?: Date;
        completed: boolean;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

export enum ProjectStatus {
    INQUIRY = 'inquiry',
    ESTIMATED = 'estimated',
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export interface PhotoDocument {
    id: string;
    url: string;
    caption: string;
    type: 'before' | 'after' | 'progress';
    timestamp: Date;
}

export interface Note {
    id: string;
    content: string;
    author: string;
    timestamp: Date;
    isInternal: boolean;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'deferred';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    assignedTo?: string[];
    dueDate?: Date;
    estimatedHours: number;
    actualHours?: number;
    completedDate?: Date;
    dependencies: string[]; // IDs of tasks that must be completed first
    checklist: {
        item: string;
        completed: boolean;
    }[];
    attachments: {
        url: string;
        type: string;
        name: string;
    }[];
    comments: {
        author: string;
        content: string;
        timestamp: Date;
    }[];
    cost?: number;
    location?: string;
    recurrence?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        endDate?: Date;
    };
}

export interface Payment {
    id: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    method: 'credit_card' | 'cash' | 'check' | 'bank_transfer';
    timestamp: Date;
    notes?: string;
}

export interface TeamMember {
    id: string;
    businessId: string;
    profileId?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    role: string;
    department?: string;
    hireDate?: Date;
    hourlyRate?: number;
    skills: string[];
    certifications?: any[];
    emergencyContact?: any;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Schedule {
    date: Date;
    projectId?: string;
    type: 'available' | 'busy' | 'off';
    startTime: Date;
    endTime: Date;
}

export interface Estimate {
    id: string;
    businessId: string;
    projectId?: string;
    customerId: string;
    estimateNumber: string;
    title: string;
    description?: string;
    items: EstimateItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
    validUntil?: Date;
    notes?: string;
    terms?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface EstimateItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

// Enhanced version of your existing Estimate interface
export interface EnhancedEstimate extends Estimate {
    validUntil: Date;
    terms: string;
    disclaimers: string;
    taxes: Tax[];
    deposits: Deposit[];
    timeline: Timeline[];
    approved: boolean;
    approvedBy?: string;
    approvedDate?: Date;
}

export interface Tax {
    name: string;
    rate: number;
    amount: number;
}

export interface Deposit {
    amount: number;
    dueDate: Date;
    paid: boolean;
    paidDate?: Date;
}

export interface Timeline {
    phase: string;
    description: string;
    duration: number; // in days
    startDate?: Date;
    endDate?: Date;
}

export interface Invoice {
    id: string;
    businessId: string;
    projectId?: string;
    customerId: string;
    estimateId?: string;
    invoiceNumber: string;
    title: string;
    description?: string;
    items: InvoiceItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled';
    dueDate?: Date;
    paidDate?: Date;
    notes?: string;
    terms?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxable: boolean;
}

// Analytics Types
export interface BusinessMetrics {
    totalRevenue: number;
    projectsCompleted: number;
    averageProjectValue: number;
    customerSatisfactionScore: number;
    leadConversionRate: number;
    activeProjects: number;
    upcomingProjects: number;
}

export interface ProjectMetrics {
    estimateAcceptanceRate: number;
    averageCompletionTime: number;
    profitMargin: number;
    customerFeedbackScore: number;
}