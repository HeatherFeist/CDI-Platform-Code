import React, { useState, useRef } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { generateAIResponse } from '../../services/geminiService';

interface EstimateWizardProps {
    projectId: string;
    onComplete: (estimateId: string) => void;
    onCancel: () => void;
}

type WizardStep = 'intro' | 'capture' | 'ai-vision' | 'details' | 'complete';

interface CapturedPhoto {
    file: File;
    preview: string;
    type: 'before';
    aiGenerated?: boolean;
}

export default function EstimateWizard({ projectId, onComplete, onCancel }: EstimateWizardProps) {
    const { userProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState<WizardStep>('intro');
    const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiResult, setAiResult] = useState<string | null>(null);
    const [estimateTitle, setEstimateTitle] = useState('');
    const [estimateDescription, setEstimateDescription] = useState('');
    const [donationPercentage, setDonationPercentage] = useState<number>(10); // Default 10% gratuity
    const [uploading, setUploading] = useState(false);

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        files.forEach(file => {
            const preview = URL.createObjectURL(file);
            setPhotos(prev => [...prev, { file, preview, type: 'before' }]);
        });
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        files.forEach(file => {
            const preview = URL.createObjectURL(file);
            setPhotos(prev => [...prev, { file, preview, type: 'before' }]);
        });
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerateAIVision = async () => {
        if (!aiPrompt.trim()) {
            alert('Please describe the renovation you want to visualize');
            return;
        }

        setAiGenerating(true);
        try {
            const designPrompt = `Based on the following renovation description, create a detailed visualization description of what the completed project will look like. Be specific about colors, materials, finishes, and overall aesthetic: ${aiPrompt}`;
            
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
            const aiDescription = await generateAIResponse(designPrompt, apiKey);
            
            setAiResult(aiDescription);
            setEstimateDescription(aiDescription || aiPrompt);
        } catch (error) {
            console.error('Error generating AI vision:', error);
            alert('Failed to generate AI visualization. You can still continue with your description.');
            setAiResult(aiPrompt);
            setEstimateDescription(aiPrompt);
        } finally {
            setAiGenerating(false);
        }
    };

    const handleComplete = async () => {
        if (!estimateTitle.trim()) {
            alert('Please provide an estimate title');
            return;
        }

        if (photos.length === 0) {
            alert('Please capture at least one "before" photo');
            return;
        }

        setUploading(true);
        try {
            // 1. Create the estimate
            const { data: estimateData, error: estimateError } = await supabase
                .from('estimates')
                .insert({
                    business_id: userProfile?.business_id,
                    project_id: projectId,
                    estimate_number: `EST-${Date.now()}`,
                    title: estimateTitle,
                    description: estimateDescription,
                    total_amount: 0,
                    status: 'draft'
                })
                .select()
                .single();

            if (estimateError) throw estimateError;

            // 2. Upload all photos
            for (let i = 0; i < photos.length; i++) {
                const photo = photos[i];
                const fileExt = photo.file.name.split('.').pop();
                const fileName = `${projectId}/${Date.now()}-${i}.${fileExt}`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('project-photos')
                    .upload(fileName, photo.file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('project-photos')
                    .getPublicUrl(fileName);

                // Create database record
                await supabase
                    .from('project_photos')
                    .insert({
                        project_id: projectId,
                        estimate_id: estimateData.id,
                        photo_type: 'before',
                        original_url: publicUrl,
                        uploaded_by: userProfile?.id,
                        display_order: i,
                        is_primary: i === 0
                    });
            }

            // 3. If AI vision was generated, save it as a note
            if (aiResult) {
                await supabase
                    .from('project_photos')
                    .insert({
                        project_id: projectId,
                        estimate_id: estimateData.id,
                        photo_type: 'ai_generated',
                        original_url: photos[0]?.preview || '',
                        ai_prompt: aiPrompt,
                        caption: aiResult,
                        uploaded_by: userProfile?.id,
                        display_order: photos.length
                    });
            }

            onComplete(estimateData.id);
        } catch (error) {
            console.error('Error creating estimate:', error);
            alert('Failed to create estimate');
        } finally {
            setUploading(false);
        }
    };

    const renderIntro = () => (
        <div className="text-center py-12">
            <div className="inline-block p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
                <span className="material-icons text-white text-6xl">auto_awesome</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Create AI-Powered Estimate
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Let's start by capturing "before" photos of the project space. 
                Then, we'll use AI to visualize what it will look like when completed!
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                    <span className="material-icons text-blue-600 text-4xl mb-3">photo_camera</span>
                    <h3 className="font-semibold text-gray-900 mb-2">1. Capture Photos</h3>
                    <p className="text-sm text-gray-600">
                        Take photos of the current state using your camera
                    </p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                    <span className="material-icons text-purple-600 text-4xl mb-3">auto_awesome</span>
                    <h3 className="font-semibold text-gray-900 mb-2">2. AI Visualization</h3>
                    <p className="text-sm text-gray-600">
                        Describe the renovation and AI creates the vision
                    </p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                    <span className="material-icons text-green-600 text-4xl mb-3">description</span>
                    <h3 className="font-semibold text-gray-900 mb-2">3. Build Estimate</h3>
                    <p className="text-sm text-gray-600">
                        Add team members, costs, and finalize the estimate
                    </p>
                </div>
            </div>
            <button
                onClick={() => setCurrentStep('capture')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
                Get Started
                <span className="material-icons ml-2 align-middle">arrow_forward</span>
            </button>
        </div>
    );

    const renderCapture = () => (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Capture "Before" Photos</h2>
                <p className="text-gray-600">
                    Take multiple photos of the project area from different angles
                </p>
            </div>

            {/* Capture Buttons */}
            <div className="flex justify-center gap-4 mb-8">
                <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all"
                >
                    <span className="material-icons text-2xl mr-3">photo_camera</span>
                    <div className="text-left">
                        <div className="font-semibold">Take Photo</div>
                        <div className="text-xs text-blue-100">Use camera</div>
                    </div>
                </button>
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleCameraCapture}
                    className="hidden"
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transform hover:scale-105 transition-all"
                >
                    <span className="material-icons text-2xl mr-3">upload</span>
                    <div className="text-left">
                        <div className="font-semibold">Upload Photos</div>
                        <div className="text-xs text-gray-100">From device</div>
                    </div>
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Photo Gallery */}
            {photos.length > 0 ? (
                <div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                        {photos.map((photo, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={photo.preview}
                                    alt={`Before photo ${index + 1}`}
                                    className="w-full h-48 object-cover rounded-lg border-2 border-blue-200"
                                />
                                <button
                                    onClick={() => removePhoto(index)}
                                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <span className="material-icons text-sm">close</span>
                                </button>
                                {index === 0 && (
                                    <span className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                                        Primary
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => setCurrentStep('intro')}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            <span className="material-icons text-sm align-middle mr-1">arrow_back</span>
                            Back
                        </button>
                        <div className="text-sm text-gray-600">
                            {photos.length} photo{photos.length !== 1 ? 's' : ''} captured
                        </div>
                        <button
                            onClick={() => setCurrentStep('ai-vision')}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            Continue to AI Vision
                            <span className="material-icons text-sm align-middle ml-1">arrow_forward</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <span className="material-icons text-gray-400 text-6xl mb-4">add_a_photo</span>
                    <p className="text-gray-600 mb-4">No photos captured yet</p>
                    <p className="text-sm text-gray-500">
                        Use the buttons above to take photos with your camera or upload from your device
                    </p>
                </div>
            )}
        </div>
    );

    const renderAIVision = () => (
        <div>
            <div className="text-center mb-8">
                <div className="inline-block p-4 bg-purple-100 rounded-full mb-4">
                    <span className="material-icons text-purple-600 text-5xl">auto_awesome</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">AI "After" Visualization</h2>
                <p className="text-gray-600">
                    See before and after comparisons - AI generates completion visualizations
                </p>
            </div>

            {/* Before & After Grid - Side by Side */}
            <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="material-icons text-blue-600 mr-2">compare</span>
                        Before & After Comparison
                    </h3>
                    
                    {/* Grid of Before/After Pairs */}
                    <div className="space-y-6">
                        {photos.slice(0, 9).map((photo, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="grid md:grid-cols-2 gap-4 p-4">
                                    {/* Before Photo */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-blue-600 flex items-center">
                                                <span className="material-icons text-sm mr-1">photo_camera</span>
                                                Before #{index + 1}
                                            </span>
                                            {index === 0 && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                        <img
                                            src={photo.preview}
                                            alt={`Before ${index + 1}`}
                                            className="w-full h-64 object-cover rounded-lg border-2 border-blue-200"
                                        />
                                    </div>

                                    {/* After Photo Slot (AI Generated) */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-purple-600 flex items-center">
                                                <span className="material-icons text-sm mr-1">auto_awesome</span>
                                                After #{index + 1}
                                            </span>
                                            {photo.aiGenerated && (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                                    AI Generated
                                                </span>
                                            )}
                                        </div>
                                        <div className="w-full h-64 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 flex items-center justify-center">
                                            {photo.aiGenerated ? (
                                                <div className="p-4 text-center">
                                                    <span className="material-icons text-purple-600 text-4xl mb-2">check_circle</span>
                                                    <p className="text-sm font-medium text-purple-700">AI Vision Complete!</p>
                                                    <p className="text-xs text-gray-600 mt-2">
                                                        {aiResult?.substring(0, 100)}...
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-center p-4">
                                                    <span className="material-icons text-purple-300 text-5xl mb-3">add_photo_alternate</span>
                                                    <p className="text-sm text-gray-500 font-medium">AI Visualization Slot</p>
                                                    <p className="text-xs text-gray-400 mt-1">Will be generated below</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {photos.length > 9 && (
                        <p className="text-sm text-gray-500 mt-4 text-center">
                            Showing first 9 photos. {photos.length - 9} more available.
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Describe the renovation you want to visualize *
                </label>
                <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Example: Transform this outdated kitchen into a modern space with white shaker-style cabinets, quartz countertops, subway tile backsplash, stainless steel appliances, and luxury vinyl plank flooring in light oak. Add recessed lighting and pendant lights over the island..."
                />
                <p className="mt-2 text-xs text-gray-500">
                    Be specific about colors, materials, styles, fixtures, and finishes
                </p>

                <button
                    onClick={handleGenerateAIVision}
                    disabled={!aiPrompt.trim() || aiGenerating}
                    className="mt-4 w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {aiGenerating ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Generating AI Vision...
                        </>
                    ) : (
                        <>
                            <span className="material-icons mr-2">auto_awesome</span>
                            Generate AI Visualization
                        </>
                    )}
                </button>
            </div>

            <div className="flex justify-between">
                <button
                    onClick={() => setCurrentStep('capture')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                    <span className="material-icons text-sm align-middle mr-1">arrow_back</span>
                    Back to Photos
                </button>
                <button
                    onClick={() => setCurrentStep('details')}
                    disabled={!aiPrompt.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    Continue to Details
                    <span className="material-icons text-sm align-middle ml-1">arrow_forward</span>
                </button>
            </div>
        </div>
    );

    const renderDetails = () => (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Estimate Details</h2>
                <p className="text-gray-600">
                    Give your estimate a title and review the description
                </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimate Title *
                    </label>
                    <input
                        type="text"
                        value={estimateTitle}
                        onChange={(e) => setEstimateTitle(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Modern Kitchen Renovation - Complete Remodel"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Description
                    </label>
                    <textarea
                        value={estimateDescription}
                        onChange={(e) => setEstimateDescription(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        {aiResult ? 'AI generated description (you can edit)' : 'Manual description'}
                    </p>
                </div>

                {/* Donation/Gratuity Selector */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-start mb-4">
                        <span className="material-icons text-green-600 mr-3 text-3xl">volunteer_activism</span>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                Support Our Nonprofit Mission
                            </h3>
                            <p className="text-sm text-gray-700 mb-2">
                                Add an optional donation to support community programs, training, and neighborhood revitalization
                            </p>
                            <p className="text-xs text-gray-600">
                                This gratuity will be automatically deducted during milestone payouts
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Donation Amount (optional)
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                            <button
                                onClick={() => setDonationPercentage(0)}
                                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                                    donationPercentage === 0
                                        ? 'bg-gray-600 text-white shadow-lg'
                                        : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                                }`}
                            >
                                No Tip
                            </button>
                            <button
                                onClick={() => setDonationPercentage(5)}
                                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                                    donationPercentage === 5
                                        ? 'bg-green-600 text-white shadow-lg'
                                        : 'bg-white border-2 border-green-300 text-gray-700 hover:border-green-400'
                                }`}
                            >
                                5%
                            </button>
                            <button
                                onClick={() => setDonationPercentage(10)}
                                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                                    donationPercentage === 10
                                        ? 'bg-green-600 text-white shadow-lg'
                                        : 'bg-white border-2 border-green-300 text-gray-700 hover:border-green-400'
                                }`}
                            >
                                10%
                            </button>
                            <button
                                onClick={() => setDonationPercentage(15)}
                                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                                    donationPercentage === 15
                                        ? 'bg-green-600 text-white shadow-lg'
                                        : 'bg-white border-2 border-green-300 text-gray-700 hover:border-green-400'
                                }`}
                            >
                                15%
                            </button>
                            <button
                                onClick={() => setDonationPercentage(20)}
                                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                                    donationPercentage === 20
                                        ? 'bg-green-600 text-white shadow-lg'
                                        : 'bg-white border-2 border-green-300 text-gray-700 hover:border-green-400'
                                }`}
                            >
                                20%
                            </button>
                        </div>
                        
                        {donationPercentage > 0 && (
                            <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                                <p className="text-sm text-green-800">
                                    <span className="material-icons text-sm align-middle mr-1">check_circle</span>
                                    <strong>{donationPercentage}% gratuity</strong> will be deducted from milestone payments to support our nonprofit programs
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <span className="material-icons text-blue-600 mr-2">info</span>
                        <div className="text-sm text-blue-900">
                            <p className="font-medium mb-1">Next Steps</p>
                            <p className="text-blue-700">
                                After creating this estimate, you'll be able to add team members, 
                                assign tasks, define costs, and submit it to your client.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button
                    onClick={() => setCurrentStep('ai-vision')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                    <span className="material-icons text-sm align-middle mr-1">arrow_back</span>
                    Back
                </button>
                <button
                    onClick={handleComplete}
                    disabled={!estimateTitle.trim() || uploading}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                    {uploading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Creating Estimate...
                        </>
                    ) : (
                        <>
                            <span className="material-icons mr-2">check_circle</span>
                            Create Estimate
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-900">New Estimate Wizard</h1>
                        {/* Progress Indicator */}
                        <div className="hidden md:flex items-center gap-2 text-sm">
                            <div className={`px-3 py-1 rounded-full ${
                                currentStep === 'intro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                                Start
                            </div>
                            <span className="material-icons text-gray-400 text-sm">chevron_right</span>
                            <div className={`px-3 py-1 rounded-full ${
                                currentStep === 'capture' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                                Photos
                            </div>
                            <span className="material-icons text-gray-400 text-sm">chevron_right</span>
                            <div className={`px-3 py-1 rounded-full ${
                                currentStep === 'ai-vision' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                                AI Vision
                            </div>
                            <span className="material-icons text-gray-400 text-sm">chevron_right</span>
                            <div className={`px-3 py-1 rounded-full ${
                                currentStep === 'details' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                                Details
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <div className="p-8">
                    {currentStep === 'intro' && renderIntro()}
                    {currentStep === 'capture' && renderCapture()}
                    {currentStep === 'ai-vision' && renderAIVision()}
                    {currentStep === 'details' && renderDetails()}
                </div>
            </div>
        </div>
    );
}
