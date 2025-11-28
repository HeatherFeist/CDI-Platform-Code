import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { generateAIResponse } from '../../services/geminiService';

interface ProjectPhoto {
    id: string;
    project_id: string;
    estimate_id: string | null;
    photo_type: 'before' | 'after' | 'progress' | 'ai_generated';
    original_url: string;
    edited_url: string | null;
    ai_prompt: string | null;
    caption: string | null;
    is_primary: boolean;
    display_order: number;
    created_at: string;
}

interface ProjectPhotoCaptureProps {
    projectId: string;
    estimateId?: string;
    onPhotosUpdated?: () => void;
}

export default function ProjectPhotosCapture({ projectId, estimateId, onPhotosUpdated }: ProjectPhotoCaptureProps) {
    const { userProfile } = useAuth();
    const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [aiProcessing, setAiProcessing] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<ProjectPhoto | null>(null);
    const [showAIEditor, setShowAIEditor] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [caption, setCaption] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchPhotos();
    }, [projectId]);

    const fetchPhotos = async () => {
        try {
            const { data, error } = await supabase
                .from('project_photos')
                .select('*')
                .eq('project_id', projectId)
                .order('display_order', { ascending: true });

            if (error) throw error;
            setPhotos(data || []);
        } catch (error) {
            console.error('Error fetching photos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File, photoType: 'before' | 'progress' = 'before') => {
        if (!userProfile?.business_id) return;

        setUploading(true);
        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${projectId}/${Date.now()}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('project-photos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('project-photos')
                .getPublicUrl(fileName);

            // Create database record
            const { error: dbError } = await supabase
                .from('project_photos')
                .insert({
                    project_id: projectId,
                    estimate_id: estimateId || null,
                    photo_type: photoType,
                    original_url: publicUrl,
                    uploaded_by: userProfile.id,
                    display_order: photos.length
                });

            if (dbError) throw dbError;

            await fetchPhotos();
            if (onPhotosUpdated) onPhotosUpdated();
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileUpload(file, 'before');
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileUpload(file, 'before');
        }
    };

    const handleAIEdit = async () => {
        if (!selectedPhoto || !aiPrompt.trim()) return;

        setAiProcessing(true);
        try {
            // Use Gemini AI to generate design concept description
            const designPrompt = `Transform this renovation project image based on: ${aiPrompt}. 
                                 Create a realistic "after" visualization showing the completed renovation.`;
            
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
            const aiDescription = await generateAIResponse(designPrompt, apiKey);
            
            // For now, we'll store the AI response/description
            // In production, you'd integrate with an image generation API like DALL-E or Midjourney
            const { error } = await supabase
                .from('project_photos')
                .insert({
                    project_id: projectId,
                    estimate_id: estimateId || null,
                    photo_type: 'ai_generated',
                    original_url: selectedPhoto.original_url,
                    edited_url: selectedPhoto.original_url, // Would be the AI-generated image URL
                    ai_prompt: aiPrompt,
                    caption: aiDescription || caption,
                    uploaded_by: userProfile?.id,
                    display_order: photos.length
                });

            if (error) throw error;

            await fetchPhotos();
            setShowAIEditor(false);
            setAiPrompt('');
            setCaption('');
            setSelectedPhoto(null);
            
            if (onPhotosUpdated) onPhotosUpdated();
            
            alert('AI visualization created! In production, this would generate an actual image using AI.');
        } catch (error) {
            console.error('Error with AI editing:', error);
            alert('Failed to create AI visualization');
        } finally {
            setAiProcessing(false);
        }
    };

    const handleSetPrimary = async (photoId: string) => {
        try {
            // Unset all primary flags
            await supabase
                .from('project_photos')
                .update({ is_primary: false })
                .eq('project_id', projectId);

            // Set new primary
            const { error } = await supabase
                .from('project_photos')
                .update({ is_primary: true })
                .eq('id', photoId);

            if (error) throw error;
            await fetchPhotos();
        } catch (error) {
            console.error('Error setting primary photo:', error);
        }
    };

    const handleDeletePhoto = async (photoId: string) => {
        if (!confirm('Are you sure you want to delete this photo?')) return;

        try {
            const { error } = await supabase
                .from('project_photos')
                .delete()
                .eq('id', photoId);

            if (error) throw error;
            await fetchPhotos();
            if (onPhotosUpdated) onPhotosUpdated();
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert('Failed to delete photo');
        }
    };

    const handleUpdateCaption = async (photoId: string, newCaption: string) => {
        try {
            const { error } = await supabase
                .from('project_photos')
                .update({ caption: newCaption })
                .eq('id', photoId);

            if (error) throw error;
            await fetchPhotos();
        } catch (error) {
            console.error('Error updating caption:', error);
        }
    };

    const getPhotoTypeIcon = (type: string) => {
        switch (type) {
            case 'before': return 'camera_alt';
            case 'after': return 'check_circle';
            case 'progress': return 'construction';
            case 'ai_generated': return 'auto_awesome';
            default: return 'image';
        }
    };

    const getPhotoTypeBadge = (type: string) => {
        const badges = {
            before: 'bg-blue-100 text-blue-800',
            after: 'bg-green-100 text-green-800',
            progress: 'bg-yellow-100 text-yellow-800',
            ai_generated: 'bg-purple-100 text-purple-800'
        };
        return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800';
    };

    const beforePhotos = photos.filter(p => p.photo_type === 'before');
    const afterPhotos = photos.filter(p => p.photo_type === 'after' || p.photo_type === 'ai_generated');
    const progressPhotos = photos.filter(p => p.photo_type === 'progress');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Upload Controls */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Photos</h3>
                
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <span className="material-icons text-sm mr-2">photo_camera</span>
                        {uploading ? 'Uploading...' : 'Take Photo'}
                    </button>
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCameraCapture}
                        className="hidden"
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                        <span className="material-icons text-sm mr-2">upload</span>
                        Upload from Device
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <div className="flex-1"></div>

                    <div className="text-sm text-gray-600">
                        <span className="material-icons text-sm align-middle mr-1">info</span>
                        Capture "before" photos first, then use AI to visualize the "after"
                    </div>
                </div>
            </div>

            {/* Before Photos */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Before Photos ({beforePhotos.length})</h4>
                </div>
                
                {beforePhotos.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <span className="material-icons text-6xl mb-2 opacity-30">add_a_photo</span>
                        <p>No "before" photos yet</p>
                        <p className="text-sm mt-1">Capture the current state of the project</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {beforePhotos.map((photo) => (
                            <div key={photo.id} className="relative group">
                                <img
                                    src={photo.original_url}
                                    alt={photo.caption || 'Before photo'}
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                                {photo.is_primary && (
                                    <span className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                                        Primary
                                    </span>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedPhoto(photo);
                                                setShowAIEditor(true);
                                            }}
                                            className="flex-1 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                                            title="Create AI visualization"
                                        >
                                            <span className="material-icons text-sm">auto_awesome</span>
                                        </button>
                                        <button
                                            onClick={() => handleSetPrimary(photo.id)}
                                            className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                            title="Set as primary"
                                        >
                                            <span className="material-icons text-sm">star</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeletePhoto(photo.id)}
                                            className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                            title="Delete"
                                        >
                                            <span className="material-icons text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                                {photo.caption && (
                                    <p className="mt-2 text-sm text-gray-600 truncate">{photo.caption}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* After/AI Generated Photos */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">After/AI Visualizations ({afterPhotos.length})</h4>
                </div>
                
                {afterPhotos.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <span className="material-icons text-6xl mb-2 opacity-30">auto_awesome</span>
                        <p>No "after" visualizations yet</p>
                        <p className="text-sm mt-1">Use AI to create visualizations from your "before" photos</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {afterPhotos.map((photo) => (
                            <div key={photo.id} className="relative group">
                                <img
                                    src={photo.edited_url || photo.original_url}
                                    alt={photo.caption || 'After photo'}
                                    className="w-full h-48 object-cover rounded-lg border-2 border-green-400"
                                />
                                <span className={`absolute top-2 left-2 px-2 py-1 text-xs rounded ${getPhotoTypeBadge(photo.photo_type)}`}>
                                    <span className="material-icons text-xs align-middle mr-1">{getPhotoTypeIcon(photo.photo_type)}</span>
                                    {photo.photo_type === 'ai_generated' ? 'AI Generated' : 'After'}
                                </span>
                                {photo.ai_prompt && (
                                    <div className="absolute top-2 right-2">
                                        <button
                                            className="p-1 bg-purple-600 text-white rounded-full"
                                            title={photo.ai_prompt}
                                        >
                                            <span className="material-icons text-sm">info</span>
                                        </button>
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSetPrimary(photo.id)}
                                            className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                            title="Set as primary"
                                        >
                                            <span className="material-icons text-sm">star</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeletePhoto(photo.id)}
                                            className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                            title="Delete"
                                        >
                                            <span className="material-icons text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                                {photo.caption && (
                                    <p className="mt-2 text-sm text-gray-600">{photo.caption}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Progress Photos */}
            {progressPhotos.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Progress Photos ({progressPhotos.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {progressPhotos.map((photo) => (
                            <div key={photo.id} className="relative group">
                                <img
                                    src={photo.original_url}
                                    alt={photo.caption || 'Progress photo'}
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                                <span className={`absolute top-2 left-2 px-2 py-1 text-xs rounded ${getPhotoTypeBadge(photo.photo_type)}`}>
                                    Progress
                                </span>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDeletePhoto(photo.id)}
                                        className="w-full px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                                {photo.caption && (
                                    <p className="mt-2 text-sm text-gray-600 truncate">{photo.caption}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Editor Modal */}
            {showAIEditor && selectedPhoto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    <span className="material-icons align-middle mr-2 text-purple-600">auto_awesome</span>
                                    AI "After" Visualization
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowAIEditor(false);
                                        setSelectedPhoto(null);
                                        setAiPrompt('');
                                        setCaption('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Before Photo</h3>
                                    <img
                                        src={selectedPhoto.original_url}
                                        alt="Before"
                                        className="w-full rounded-lg border-2 border-gray-300"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">AI Visualization Preview</h3>
                                    <div className="w-full aspect-square rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 flex items-center justify-center">
                                        <div className="text-center text-gray-500">
                                            <span className="material-icons text-6xl mb-2 opacity-30">auto_awesome</span>
                                            <p className="text-sm">AI will generate visualization</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Describe the renovation you want to visualize *
                                    </label>
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Example: Replace the old wooden cabinets with modern white shaker-style cabinets, add a subway tile backsplash, install stainless steel appliances, and replace the floor with light gray hardwood..."
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Be specific about colors, materials, styles, and changes you want to see
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Caption for estimate (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="e.g., Modern Kitchen Renovation - Completed Look"
                                    />
                                </div>

                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <span className="material-icons text-purple-600 mr-2">info</span>
                                        <div className="text-sm text-purple-900">
                                            <p className="font-medium mb-1">AI Visualization Feature</p>
                                            <p className="text-purple-700">
                                                This feature uses AI to help visualize the completed project. 
                                                In production, this would integrate with image generation APIs 
                                                like DALL-E or Midjourney to create realistic "after" images.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => {
                                            setShowAIEditor(false);
                                            setSelectedPhoto(null);
                                            setAiPrompt('');
                                            setCaption('');
                                        }}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAIEdit}
                                        disabled={!aiPrompt.trim() || aiProcessing}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
                                    >
                                        {aiProcessing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-icons text-sm mr-2">auto_awesome</span>
                                                Generate AI Visualization
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
