import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../services/business/projectService';
import { Project, ProjectStatus } from '../types/business';
import { NewProjectModal } from './NewProjectModal';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Trash2 } from 'lucide-react';

export const BusinessProjectsView: React.FC = () => {
    const { userProfile } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all');
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

    useEffect(() => {
        if (userProfile?.business_id) {
            loadProjects();
        }
    }, [selectedStatus, userProfile]);

    const loadProjects = async () => {
        if (!userProfile?.business_id) {
            setError('No business ID found');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            console.log('🔄 [PROJECTS] Loading projects for business:', userProfile.business_id);
            console.log('🔄 [PROJECTS] Using projectService:', projectService);
            
            // Just load all projects for this business - simple!
            const allProjects = await projectService.getBusinessProjects(userProfile.business_id);
            
            console.log('✅ [PROJECTS] Loaded', allProjects.length, 'total projects');
            
            // Filter by status if needed
            const filteredProjects = selectedStatus === 'all' 
                ? allProjects 
                : allProjects.filter(p => p.status === selectedStatus);
            
            console.log('✅ [PROJECTS] Showing', filteredProjects.length, 'projects');
            setProjects(filteredProjects);
        } catch (err) {
            console.error('❌ [PROJECTS] Error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: ProjectStatus) => {
        switch (status) {
            case ProjectStatus.INQUIRY:
                return 'bg-blue-100 text-blue-800';
            case ProjectStatus.ESTIMATED:
                return 'bg-yellow-100 text-yellow-800';
            case ProjectStatus.IN_PROGRESS:
                return 'bg-green-100 text-green-800';
            case ProjectStatus.COMPLETED:
                return 'bg-gray-100 text-gray-800';
            case ProjectStatus.SCHEDULED:
                return 'bg-purple-100 text-purple-800';
            case ProjectStatus.CANCELLED:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleDeleteProject = async (projectId: string, projectName: string) => {
        if (!confirm(`Are you sure you want to delete "${projectName}"? This cannot be undone.`)) {
            return;
        }

        setDeletingProjectId(projectId);
        try {
            await projectService.deleteProject(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
        } catch (err) {
            console.error('❌ Failed to delete project:', err);
            alert('Failed to delete project. Please try again.');
        } finally {
            setDeletingProjectId(null);
        }
    };

    const handleViewProject = (projectId: string) => {
        // Navigate to active project view
        navigate(`/business/projects/${projectId}/active`);
    };

    if (error) {
        return (
            <div className="p-4 text-red-500">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Projects</h1>
                <button 
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => setShowNewProjectModal(true)}
                >
                    New Project
                </button>
            </div>

            <NewProjectModal
                isOpen={showNewProjectModal}
                onClose={() => setShowNewProjectModal(false)}
                onProjectCreated={(project) => {
                    setProjects(prev => [...prev, project]);
                    setShowNewProjectModal(false);
                }}
            />

            <div className="mb-4">
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as ProjectStatus | 'all')}
                    className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                >
                    <option value="all">All Projects</option>
                    {Object.values(ProjectStatus).map(status => (
                        <option key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map(project => (
                        <div 
                            key={project.id} 
                            className="border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden bg-white"
                        >
                            {project.photos && project.photos.length > 0 && (
                                <div 
                                    className="h-48 w-full overflow-hidden cursor-pointer"
                                    onClick={() => handleViewProject(project.id)}
                                >
                                    <img
                                        src={project.photos[0].url}
                                        alt={project.name}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                    />
                                </div>
                            )}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 
                                        className="text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                                        onClick={() => handleViewProject(project.id)}
                                    >
                                        {project.name}
                                    </h3>
                                    <button
                                        onClick={() => handleDeleteProject(project.id, project.name)}
                                        disabled={deletingProjectId === project.id}
                                        className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                                        title="Delete project"
                                    >
                                        {deletingProjectId === project.id ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                <span className={`inline-block px-2 py-1 rounded-full text-sm ${getStatusColor(project.status)}`}>
                                    {project.status.replace(/_/g, ' ')}
                                </span>
                                <p className="text-gray-600 mt-2 line-clamp-2">{project.description}</p>
                                <div className="mt-4 flex justify-between items-center">
                                    <span className="text-sm text-gray-500">
                                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not started'}
                                    </span>
                                    <button 
                                        className="text-blue-500 hover:text-blue-700 font-medium"
                                        onClick={() => handleViewProject(project.id)}
                                    >
                                        View Details →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && projects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No projects found. Create a new project to get started.
                </div>
            )}
        </div>
    );
};