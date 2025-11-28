import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectPhotosCapture from '../business/ProjectPhotosCapture';
import CollaborativeEstimateBuilder from '../business/CollaborativeEstimateBuilder';
import ActiveProjectView from '../business/ActiveProjectView';
import ClientEstimateView from '../public/ClientEstimateView';
import { useAuth } from '../../contexts/SupabaseAuthContext';

// Wrapper for ProjectPhotosCapture that gets projectId from URL params
export function ProjectPhotosCaptureRoute() {
    const { projectId } = useParams<{ projectId: string }>();
    
    if (!projectId) {
        return <div className="p-6 text-red-600">Project ID is required</div>;
    }
    
    return <ProjectPhotosCapture projectId={projectId} />;
}

// Wrapper for CollaborativeEstimateBuilder that gets projectId from URL params
export function CollaborativeEstimateBuilderRoute() {
    const { projectId } = useParams<{ projectId: string }>();
    
    if (!projectId) {
        return <div className="p-6 text-red-600">Project ID is required</div>;
    }
    
    return <CollaborativeEstimateBuilder projectId={projectId} />;
}

// Wrapper for ActiveProjectView that gets projectId from URL params and determines viewMode from context
export function ActiveProjectViewRoute() {
    const { projectId } = useParams<{ projectId: string }>();
    const { currentContext } = useAuth();
    
    if (!projectId) {
        return <div className="p-6 text-red-600">Project ID is required</div>;
    }
    
    // Determine view mode based on current context
    const viewMode = (currentContext === 'business_owner' || currentContext === 'contractor') 
        ? 'contractor' 
        : 'team_member';
    
    return <ActiveProjectView projectId={projectId} viewMode={viewMode} />;
}

// Wrapper for ClientEstimateView that gets estimateId from URL params
export function ClientEstimateViewRoute() {
    const { estimateId } = useParams<{ estimateId: string }>();
    
    if (!estimateId) {
        return <div className="p-6 text-red-600">Estimate ID is required</div>;
    }
    
    return <ClientEstimateView estimateId={estimateId} />;
}
