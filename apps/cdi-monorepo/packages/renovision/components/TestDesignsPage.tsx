import React, { useState } from 'react';
import { SavedDesignsPicker, SavedDesign } from '../components/shared/SavedDesignsPicker';

/**
 * TEST PAGE: Saved Designs Picker
 * 
 * Purpose: Test the SavedDesignsPicker component in isolation
 * Route: /test-designs
 * 
 * What to test:
 * 1. Component renders without errors
 * 2. Empty state shows when no designs exist
 * 3. Loading state displays correctly
 * 4. Designs appear after Gemini saves one
 * 5. Search functionality works
 * 6. Preview modal opens/closes
 * 7. Select callback fires correctly
 * 8. Delete functionality works (if owner)
 */

export function TestDesignsPage() {
    const [showPicker, setShowPicker] = useState(true);
    const [selectedDesign, setSelectedDesign] = useState<SavedDesign | null>(null);
    const [allSelected, setAllSelected] = useState<SavedDesign[]>([]);

    const handleSelectSingle = (design: SavedDesign) => {
        console.log('✅ Design selected:', design);
        setSelectedDesign(design);
    };

    const handleSelectMulti = (design: SavedDesign) => {
        console.log('✅ Design added to multi-select:', design);
        setAllSelected(prev => [...prev, design]);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h1 className="text-3xl font-bold mb-2">🧪 Saved Designs Picker - Test Page</h1>
                    <p className="text-gray-600">
                        Testing the SavedDesignsPicker component integration
                    </p>
                </div>

                {/* Test Controls */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Test Controls</h2>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowPicker(!showPicker)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            {showPicker ? 'Hide' : 'Show'} Picker
                        </button>
                        <button
                            onClick={() => {
                                setSelectedDesign(null);
                                setAllSelected([]);
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                            Clear Selections
                        </button>
                    </div>
                </div>

                {/* Test Results */}
                {selectedDesign && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-bold text-green-800 mb-3">
                            ✅ Last Selected Design
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <img 
                                    src={selectedDesign.thumbnail_url} 
                                    alt={selectedDesign.name}
                                    className="w-full rounded-lg shadow"
                                />
                            </div>
                            <div className="text-sm">
                                <p><strong>Name:</strong> {selectedDesign.name}</p>
                                <p><strong>ID:</strong> {selectedDesign.id}</p>
                                <p><strong>User ID:</strong> {selectedDesign.user_id}</p>
                                <p><strong>Storage Path:</strong> {selectedDesign.storage_path}</p>
                                <p><strong>Created:</strong> {new Date(selectedDesign.created_at).toLocaleString()}</p>
                                {selectedDesign.generation_prompt && (
                                    <p className="mt-2">
                                        <strong>AI Prompt:</strong><br/>
                                        <span className="text-gray-600 italic">"{selectedDesign.generation_prompt}"</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {allSelected.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-bold text-purple-800 mb-3">
                            ✅ Multi-Selected Designs ({allSelected.length})
                        </h3>
                        <div className="grid grid-cols-6 gap-2">
                            {allSelected.map(design => (
                                <div key={design.id} className="text-center">
                                    <img 
                                        src={design.thumbnail_url} 
                                        alt={design.name}
                                        className="w-full aspect-square object-cover rounded"
                                    />
                                    <p className="text-xs mt-1 truncate">{design.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Test Scenarios */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Single Select Test */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-bold mb-3">Test 1: Single Select</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Click a design to select it. Picker should close automatically.
                        </p>
                        {showPicker && (
                            <SavedDesignsPicker
                                onSelect={handleSelectSingle}
                                onClose={() => setShowPicker(false)}
                                showPrompts={true}
                                columns={3}
                                maxHeight="400px"
                            />
                        )}
                    </div>

                    {/* Multi-Select Test */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-bold mb-3">Test 2: Multi-Select</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Select multiple designs. Click "Use Selected" when done.
                        </p>
                        {showPicker && (
                            <SavedDesignsPicker
                                allowMultiSelect={true}
                                onSelect={handleSelectMulti}
                                onClose={() => setShowPicker(false)}
                                showPrompts={true}
                                columns={2}
                                maxHeight="400px"
                            />
                        )}
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-blue-800 mb-3">📋 Testing Instructions</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li><strong>Empty State:</strong> If no designs exist, you should see "No designs found" message</li>
                        <li><strong>Ask Gemini:</strong> Have Gemini generate and save a test design in his AI Design App</li>
                        <li><strong>Refresh:</strong> Reload this page - the design should appear in both pickers</li>
                        <li><strong>Search:</strong> Type in search box to filter by name or prompt</li>
                        <li><strong>Preview:</strong> Hover over design and click eye icon to preview full-size</li>
                        <li><strong>Select:</strong> Click a design - it should appear in "Last Selected" box above</li>
                        <li><strong>Multi-Select:</strong> In right picker, click multiple designs, then "Use Selected"</li>
                        <li><strong>Delete:</strong> Hover and click trash icon (only works if you own the design)</li>
                    </ol>
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800">
                            <strong>⚠️ Note:</strong> Open browser console to see detailed logs of all actions
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
