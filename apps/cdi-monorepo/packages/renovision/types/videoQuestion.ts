export interface VideoQuestion {
    id: string;
    projectId?: string;
    videoUrl: string;
    question: string;
    timestamp: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    estimateId?: string;
    aiResponse?: {
        analysis: string;
        suggestedProducts: string[];
        estimatedCost: number;
        timelineEstimate: number; // in days
        additionalNotes: string;
    };
    transcription?: string;
}