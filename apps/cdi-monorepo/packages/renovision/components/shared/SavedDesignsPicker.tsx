import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';

export interface SavedDesign {
    id: string;
    user_id: string;
    name: string;
    storage_path: string;
    thumbnail_url: string;
    generation_prompt?: string;
    created_at: string;
    updated_at: string;
}

interface SavedDesignsPickerProps {
    onSelect: (design: SavedDesign) => void;
    onClose?: () => void;
    userId?: string; // Optional: filter by specific user
    allowMultiSelect?: boolean;
    showPrompts?: boolean;
    columns?: number; // Grid columns (default: 3)
    maxHeight?: string; // Max height for scrolling (default: '600px')
}

export const SavedDesignsPicker: React.FC<SavedDesignsPickerProps> = ({
    onSelect,
    onClose,
    userId,
    allowMultiSelect = false,
    showPrompts = true,
    columns = 3,
    maxHeight = '600px'
}) => {
    const { userProfile } = useAuth();
    const [designs, setDesigns] = useState<SavedDesign[]>([]);
    const [filteredDesigns, setFilteredDesigns] = useState<SavedDesign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDesigns, setSelectedDesigns] = useState<Set<string>>(new Set());
    const [previewDesign, setPreviewDesign] = useState<SavedDesign | null>(null);

    // Fetch designs from Supabase
    useEffect(() => {
        fetchDesigns();
    }, [userId]);

    // Filter designs based on search
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredDesigns(designs);
        } else {
            const term = searchTerm.toLowerCase();
            const filtered = designs.filter(design => 
                design.name.toLowerCase().includes(term) ||
                (design.generation_prompt?.toLowerCase().includes(term))
            );
            setFilteredDesigns(filtered);
        }
    }, [searchTerm, designs]);

    const fetchDesigns = async () => {
        try {
            console.log('🎨 [SavedDesignsPicker] Starting fetch...');
            console.log('🎨 [SavedDesignsPicker] User filter:', userId || 'None (all designs)');
            
            setLoading(true);
            setError(null);

            let query = supabase
                .from('saved_designs')
                .select('*')
                .order('created_at', { ascending: false });

            // Filter by user if specified
            if (userId) {
                console.log('🎨 [SavedDesignsPicker] Filtering by user_id:', userId);
                query = query.eq('user_id', userId);
            }

            console.log('🎨 [SavedDesignsPicker] Executing Supabase query...');
            const { data, error: fetchError } = await query;

            if (fetchError) {
                console.error('❌ [SavedDesignsPicker] Supabase error:', fetchError);
                throw fetchError;
            }

            console.log('✅ [SavedDesignsPicker] Query successful!');
            console.log('✅ [SavedDesignsPicker] Designs found:', data?.length || 0);
            console.log('✅ [SavedDesignsPicker] Data:', data);

            setDesigns(data || []);
            setFilteredDesigns(data || []);
        } catch (err) {
            console.error('❌ [SavedDesignsPicker] Error fetching designs:', err);
            setError(err instanceof Error ? err.message : 'Failed to load designs');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDesign = (design: SavedDesign) => {
        if (allowMultiSelect) {
            const newSelected = new Set(selectedDesigns);
            if (newSelected.has(design.id)) {
                newSelected.delete(design.id);
            } else {
                newSelected.add(design.id);
            }
            setSelectedDesigns(newSelected);
        } else {
            onSelect(design);
            onClose?.();
        }
    };

    const handleConfirmSelection = () => {
        if (allowMultiSelect) {
            const selected = designs.filter(d => selectedDesigns.has(d.id));
            selected.forEach(design => onSelect(design));
            onClose?.();
        }
    };

    const handleDeleteDesign = async (designId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (!confirm('Are you sure you want to delete this design?')) return;

        try {
            const design = designs.find(d => d.id === designId);
            if (!design) return;

            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('designs')
                .remove([design.storage_path]);

            if (storageError) throw storageError;

            // Delete from database
            const { error: dbError } = await supabase
                .from('saved_designs')
                .delete()
                .eq('id', designId);

            if (dbError) throw dbError;

            // Update local state
            setDesigns(prev => prev.filter(d => d.id !== designId));
        } catch (err) {
            console.error('Error deleting design:', err);
            alert('Failed to delete design: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const gridCols = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5'
    }[columns] || 'grid-cols-3';

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">Error: {error}</p>
                <button 
                    onClick={fetchDesigns}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg">
            {/* Header */}
            <div className="p-6 border-b">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Saved Designs</h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search designs by name or prompt..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            ×
                        </button>
                    )}
                </div>

                <p className="mt-2 text-sm text-gray-600">
                    {filteredDesigns.length} design{filteredDesigns.length !== 1 ? 's' : ''} found
                </p>
            </div>

            {/* Designs Grid */}
            <div 
                className="p-6 overflow-y-auto"
                style={{ maxHeight }}
            >
                {filteredDesigns.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg font-medium">No designs found</p>
                        <p className="text-sm mt-1">
                            {searchTerm ? 'Try a different search term' : 'Create your first design in the AI Design App!'}
                        </p>
                    </div>
                ) : (
                    <div className={`grid ${gridCols} gap-4`}>
                        {filteredDesigns.map((design) => {
                            const isSelected = selectedDesigns.has(design.id);
                            const canDelete = !userId || design.user_id === userProfile?.id;

                            return (
                                <div
                                    key={design.id}
                                    className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                                        isSelected 
                                            ? 'border-blue-500 shadow-lg' 
                                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                                    }`}
                                    onClick={() => handleSelectDesign(design)}
                                >
                                    {/* Image */}
                                    <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                                        <img
                                            src={design.thumbnail_url}
                                            alt={design.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            onError={(e) => {
                                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ddd"/></svg>';
                                            }}
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="p-3">
                                        <h3 className="font-semibold text-sm truncate" title={design.name}>
                                            {design.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(design.created_at).toLocaleDateString()}
                                        </p>
                                        
                                        {showPrompts && design.generation_prompt && (
                                            <p className="text-xs text-gray-600 mt-2 line-clamp-2" title={design.generation_prompt}>
                                                "{design.generation_prompt}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewDesign(design);
                                            }}
                                            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                                            title="Preview"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>

                                        {canDelete && (
                                            <button
                                                onClick={(e) => handleDeleteDesign(design.id, e)}
                                                className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600"
                                                title="Delete"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    {/* Selection Indicator */}
                                    {isSelected && (
                                        <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full p-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            {allowMultiSelect && selectedDesigns.size > 0 && (
                <div className="p-6 border-t bg-gray-50">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            {selectedDesigns.size} design{selectedDesigns.size !== 1 ? 's' : ''} selected
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedDesigns(new Set())}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                                Clear Selection
                            </button>
                            <button
                                onClick={handleConfirmSelection}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Use Selected ({selectedDesigns.size})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewDesign && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setPreviewDesign(null)}
                >
                    <div 
                        className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold">{previewDesign.name}</h3>
                            <button
                                onClick={() => setPreviewDesign(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4">
                            <img
                                src={previewDesign.thumbnail_url}
                                alt={previewDesign.name}
                                className="w-full h-auto rounded-lg"
                            />
                            {previewDesign.generation_prompt && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">AI Prompt:</p>
                                    <p className="text-sm text-gray-600">{previewDesign.generation_prompt}</p>
                                </div>
                            )}
                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={() => {
                                        onSelect(previewDesign);
                                        setPreviewDesign(null);
                                        onClose?.();
                                    }}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Use This Design
                                </button>
                                <button
                                    onClick={() => setPreviewDesign(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
