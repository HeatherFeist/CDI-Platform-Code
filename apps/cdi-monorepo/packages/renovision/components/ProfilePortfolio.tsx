import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';

interface PortfolioPhoto {
    id: string;
    profile_id: string;
    photo_url: string;
    title: string;
    description?: string;
    project_type?: string;
    completion_date?: string;
    is_featured: boolean;
    display_order: number;
    created_at: string;
}

interface ProfilePortfolioProps {
    profileId?: string; // If viewing someone else's profile
    isOwnProfile?: boolean;
}

const ProfilePortfolio: React.FC<ProfilePortfolioProps> = ({ 
    profileId, 
    isOwnProfile = true 
}) => {
    const { userProfile } = useAuth();
    const [portfolioPhotos, setPortfolioPhotos] = useState<PortfolioPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        project_type: '',
        completion_date: '',
        is_featured: false
    });

    const targetProfileId = profileId || userProfile?.id;

    useEffect(() => {
        if (targetProfileId) {
            fetchPortfolioPhotos();
        }
    }, [targetProfileId]);

    const fetchPortfolioPhotos = async () => {
        try {
            const { data, error } = await supabase
                .from('profile_portfolio')
                .select('*')
                .eq('profile_id', targetProfileId)
                .order('display_order', { ascending: true });

            if (error) throw error;
            setPortfolioPhotos(data || []);
        } catch (error) {
            console.error('Error fetching portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !userProfile) return;

        setUploading(true);
        try {
            // Upload to Supabase Storage
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${userProfile.id}/${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('portfolio-photos')
                .upload(fileName, selectedFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('portfolio-photos')
                .getPublicUrl(fileName);

            // Get next display order
            const maxOrder = Math.max(...portfolioPhotos.map(p => p.display_order), 0);

            // Save to database
            const { error: dbError } = await supabase
                .from('profile_portfolio')
                .insert({
                    profile_id: userProfile.id,
                    photo_url: publicUrl,
                    title: formData.title,
                    description: formData.description,
                    project_type: formData.project_type || null,
                    completion_date: formData.completion_date || null,
                    is_featured: formData.is_featured,
                    display_order: maxOrder + 1
                });

            if (dbError) throw dbError;

            // Reset form
            setSelectedFile(null);
            setPreviewUrl('');
            setFormData({
                title: '',
                description: '',
                project_type: '',
                completion_date: '',
                is_featured: false
            });
            setShowAddModal(false);

            // Refresh portfolio
            fetchPortfolioPhotos();
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload photo. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (photoId: string, photoUrl: string) => {
        if (!confirm('Are you sure you want to delete this portfolio photo?')) return;

        try {
            // Extract file path from URL
            const urlParts = photoUrl.split('/portfolio-photos/');
            if (urlParts.length > 1) {
                const filePath = urlParts[1];
                await supabase.storage
                    .from('portfolio-photos')
                    .remove([filePath]);
            }

            // Delete from database
            const { error } = await supabase
                .from('profile_portfolio')
                .delete()
                .eq('id', photoId);

            if (error) throw error;

            // Refresh portfolio
            fetchPortfolioPhotos();
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert('Failed to delete photo. Please try again.');
        }
    };

    const toggleFeatured = async (photoId: string, currentFeatured: boolean) => {
        try {
            const { error } = await supabase
                .from('profile_portfolio')
                .update({ is_featured: !currentFeatured })
                .eq('id', photoId);

            if (error) throw error;
            fetchPortfolioPhotos();
        } catch (error) {
            console.error('Error updating featured status:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <span className="inline-block animate-spin material-icons text-4xl text-blue-600">refresh</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Portfolio</h2>
                    <p className="text-sm text-gray-600">
                        {isOwnProfile 
                            ? 'Showcase your best work to attract collaboration opportunities'
                            : 'View completed projects and work samples'
                        }
                    </p>
                </div>
                {isOwnProfile && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <span className="material-icons">add_photo_alternate</span>
                        Add Photo
                    </button>
                )}
            </div>

            {/* Empty State */}
            {portfolioPhotos.length === 0 && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <span className="material-icons-outlined text-6xl text-gray-400 mb-4">photo_library</span>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        {isOwnProfile ? 'No Portfolio Photos Yet' : 'No Portfolio Photos'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {isOwnProfile 
                            ? 'Add photos of your completed projects to showcase your skills and attract collaboration opportunities.'
                            : 'This contractor hasn\'t added any portfolio photos yet.'
                        }
                    </p>
                    {isOwnProfile && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <span className="material-icons">add_photo_alternate</span>
                            Add Your First Photo
                        </button>
                    )}
                </div>
            )}

            {/* Portfolio Grid */}
            {portfolioPhotos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {portfolioPhotos.map((photo) => (
                        <div 
                            key={photo.id}
                            className="relative group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                        >
                            {/* Featured Badge */}
                            {photo.is_featured && (
                                <div className="absolute top-2 left-2 z-10 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                                    <span className="material-icons text-sm">star</span>
                                    Featured
                                </div>
                            )}

                            {/* Image */}
                            <div className="aspect-video bg-gray-200 relative">
                                <img 
                                    src={photo.photo_url} 
                                    alt={photo.title}
                                    className="w-full h-full object-cover"
                                />
                                
                                {/* Overlay Actions (Own Profile) */}
                                {isOwnProfile && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => toggleFeatured(photo.id, photo.is_featured)}
                                            className="p-2 bg-white rounded-full hover:bg-yellow-100 transition-colors"
                                            title={photo.is_featured ? 'Remove from featured' : 'Mark as featured'}
                                        >
                                            <span className="material-icons text-yellow-600">
                                                {photo.is_featured ? 'star' : 'star_outline'}
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(photo.id, photo.photo_url)}
                                            className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors"
                                            title="Delete photo"
                                        >
                                            <span className="material-icons text-red-600">delete</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 mb-1">{photo.title}</h3>
                                {photo.description && (
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{photo.description}</p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    {photo.project_type && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                            {photo.project_type}
                                        </span>
                                    )}
                                    {photo.completion_date && (
                                        <span>
                                            {new Date(photo.completion_date).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Photo Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 space-y-4">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-gray-900">Add Portfolio Photo</h3>
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setSelectedFile(null);
                                        setPreviewUrl('');
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Photo <span className="text-red-500">*</span>
                                </label>
                                {!previewUrl ? (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            id="portfolio-upload"
                                        />
                                        <label htmlFor="portfolio-upload" className="cursor-pointer">
                                            <span className="material-icons-outlined text-6xl text-gray-400 mb-4">cloud_upload</span>
                                            <p className="text-gray-600 mb-2">Click to upload a photo</p>
                                            <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <img 
                                            src={previewUrl} 
                                            alt="Preview"
                                            className="w-full rounded-lg"
                                        />
                                        <button
                                            onClick={() => {
                                                setSelectedFile(null);
                                                setPreviewUrl('');
                                            }}
                                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                                        >
                                            <span className="material-icons">close</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Form Fields */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Kitchen Remodel - Modern Design"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the project, challenges overcome, techniques used..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Project Type
                                    </label>
                                    <select
                                        value={formData.project_type}
                                        onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select type...</option>
                                        <option value="Kitchen">Kitchen</option>
                                        <option value="Bathroom">Bathroom</option>
                                        <option value="Flooring">Flooring</option>
                                        <option value="Painting">Painting</option>
                                        <option value="Roofing">Roofing</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="HVAC">HVAC</option>
                                        <option value="Landscaping">Landscaping</option>
                                        <option value="Decking">Decking</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Completion Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.completion_date}
                                        onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is-featured"
                                    checked={formData.is_featured}
                                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <label htmlFor="is-featured" className="text-sm text-gray-700">
                                    Mark as featured (shows with ⭐ badge)
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setSelectedFile(null);
                                        setPreviewUrl('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!selectedFile || !formData.title || uploading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <span className="inline-block animate-spin material-icons">refresh</span>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons">cloud_upload</span>
                                            Add to Portfolio
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePortfolio;
