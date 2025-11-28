import React, { useState, useEffect } from 'react';
import { generateEstimateFromNaturalLanguage, GeneratedEstimate } from '../../services/geminiService';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface NaturalLanguageEstimateFormProps {
    onEstimateGenerated: (estimate: GeneratedEstimate) => void;
    onCancel: () => void;
}

export const NaturalLanguageEstimateForm: React.FC<NaturalLanguageEstimateFormProps> = ({
    onEstimateGenerated,
    onCancel
}) => {
    const { userProfile } = useAuth();
    const [projectDescription, setProjectDescription] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [loadingKey, setLoadingKey] = useState(true);
    const [projectImages, setProjectImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    useEffect(() => {
        fetchAPIKey();
    }, [userProfile]);

    const fetchAPIKey = async () => {
        if (!userProfile?.business_id) {
            setLoadingKey(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('businesses')
                .select('gemini_api_key')
                .eq('id', userProfile.business_id)
                .single();

            if (error) throw error;

            setApiKey(data?.gemini_api_key || null);
        } catch (error) {
            console.error('Error fetching API key:', error);
            setError('Failed to load API key. Please configure it in AI Settings.');
        } finally {
            setLoadingKey(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        
        // Limit to 5 images
        if (files.length + projectImages.length > 5) {
            setError('Maximum 5 images allowed');
            return;
        }

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                setError(`${file.name} is not an image file`);
                return false;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                setError(`${file.name} is too large (max 10MB)`);
                return false;
            }
            return true;
        });

        setProjectImages(prev => [...prev, ...validFiles]);

        // Create preview URLs
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setProjectImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        if (!projectDescription.trim()) {
            setError('Please describe your project');
            return;
        }

        if (!zipCode.trim() || zipCode.length < 5) {
            setError('Please enter a valid ZIP code');
            return;
        }

        if (!apiKey) {
            setError('Gemini API key not configured. Please go to AI Settings to add your API key.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Starting estimate generation...');
            console.log('Description:', projectDescription);
            console.log('ZIP Code:', zipCode);
            console.log('Images:', projectImages.length);

            let estimate: GeneratedEstimate;

            // Add 3-minute timeout (more generous for image processing)
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Request timed out after 3 minutes. Please try again with fewer images or a simpler description.')), 180000);
            });

            // Use image-enhanced generation if images are provided
            if (projectImages.length > 0) {
                console.log('Using image-enhanced generation...');
                const { generateEstimateFromImagesAndText } = await import('../../services/geminiService');
                estimate = await Promise.race([
                    generateEstimateFromImagesAndText(projectDescription, zipCode, projectImages, apiKey),
                    timeoutPromise
                ]);
            } else {
                console.log('Using text-only generation...');
                estimate = await Promise.race([
                    generateEstimateFromNaturalLanguage(projectDescription, zipCode, apiKey),
                    timeoutPromise
                ]);
            }

            console.log('Estimate generated successfully:', estimate);
            onEstimateGenerated(estimate);
        } catch (err) {
            console.error('Failed to generate estimate:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate estimate';
            setError(`Error: ${errorMessage}. Please check the console for details.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Create Estimate with AI
                </h2>
                <p className="text-gray-600">
                    Describe your project in plain language - include what needs to be done, measurements, and any specific requirements. The AI will generate a detailed estimate with regional pricing.
                </p>
            </div>

            {loadingKey ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading AI configuration...</span>
                </div>
            ) : !apiKey ? (
                <div className="mb-4 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                        <span className="material-icons text-yellow-600 mr-3">warning</span>
                        <div>
                            <h3 className="font-semibold text-yellow-900 mb-1">API Key Required</h3>
                            <p className="text-yellow-800 mb-3">
                                Please configure your Gemini API key to use AI-powered estimates.
                            </p>
                            <a 
                                href="/business/ai-settings" 
                                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                            >
                                <span className="material-icons text-sm mr-2">settings</span>
                                Go to AI Settings
                            </a>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start">
                                <span className="material-icons text-red-600 mr-2">error</span>
                                <p className="text-red-800">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ZIP Code *
                    </label>
                    <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="e.g., 43201"
                        maxLength={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        Used for regional pricing calculations
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Project Description *
                    </label>
                    <textarea
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="Example: I need to remodel my master bathroom. It's about 8 feet by 10 feet. I want to replace the existing tile with new porcelain tiles, install a new vanity with granite countertop, replace the toilet and fixtures, paint the walls, and add recessed lighting. The ceiling is 9 feet high."
                        rows={8}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                        disabled={loading}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        Include: project name, what needs to be done, measurements (dimensions, square footage, etc.), materials, and any specific requirements
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Project Images (Optional)
                    </label>
                    <div className="space-y-3">
                        {/* Image Upload Button */}
                        <div className="flex items-center gap-3">
                            <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={loading || projectImages.length >= 5}
                                />
                                <span className="material-icons text-gray-400 mr-2">add_photo_alternate</span>
                                <span className="text-sm font-medium text-gray-700">
                                    Upload Images ({projectImages.length}/5)
                                </span>
                            </label>
                            {projectImages.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProjectImages([]);
                                        setImagePreviews([]);
                                    }}
                                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {/* Image Previews */}
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={preview}
                                            alt={`Project image ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                            disabled={loading}
                                        >
                                            <span className="material-icons text-sm">close</span>
                                        </button>
                                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                                            {projectImages[index]?.name.substring(0, 15)}...
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <p className="text-sm text-gray-500">
                            <span className="material-icons text-xs align-middle mr-1">info</span>
                            Upload up to 5 images to help the AI better understand your project (max 10MB each)
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <span className="material-icons text-blue-600 mr-2">lightbulb</span>
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-1">Pro Tips:</h3>
                            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                <li>Be specific about measurements (square feet, linear feet, room dimensions)</li>
                                <li>Mention materials you prefer (hardwood, tile, granite, etc.)</li>
                                <li>Include any special requirements or existing conditions</li>
                                <li><strong>Upload images</strong> showing the current condition, damages, or areas to be worked on</li>
                                <li>The AI will estimate standard items if you don't specify everything</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !projectDescription.trim() || !zipCode.trim()}
                        className={`
                            flex-1 px-6 py-3 rounded-lg font-semibold
                            flex items-center justify-center gap-2
                            transition-all duration-200
                            ${loading || !projectDescription.trim() || !zipCode.trim()
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                            }
                        `}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                <span>Generating Estimate...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-icons">auto_awesome</span>
                                <span>Generate AI Estimate</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {loading && (
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="animate-pulse">
                            <span className="material-icons text-blue-600 text-3xl">psychology</span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">AI is analyzing your project...</p>
                            <p className="text-sm text-gray-600 mt-1">
                                {projectImages.length > 0 
                                    ? `Analyzing ${projectImages.length} image${projectImages.length > 1 ? 's' : ''}, breaking down tasks, calculating quantities, applying regional pricing for ZIP ${zipCode}`
                                    : `Breaking down tasks, calculating quantities, applying regional pricing for ZIP ${zipCode}`
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}
                </>
            )}
        </div>
    );
};

export default NaturalLanguageEstimateForm;
