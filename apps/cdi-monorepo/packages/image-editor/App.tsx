/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Supabase imports
import { supabase, supabaseError, uploadDesign, fetchDesigns, deleteDesign } from './supabase';
import { User } from '@supabase/supabase-js';

// Component imports
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import Toolbar, { Tool } from './components/Toolbar';
import Catalog from './components/Catalog';
import TouchGhost from './components/TouchGhost';
import Spinner from './components/Spinner';
import AddProductModal from './components/AddProductModal';
import AddPaintModal from './components/AddPaintModal';
import DebugModal from './components/DebugModal';
import ModelViewerModal from './components/ModelViewerModal';
import EraseControls from './components/EraseControls';
import MoveConfirmationModal from './components/MoveConfirmationModal';
import HighlightControls from './components/HighlightControls';
import TextEditControls from './components/TextEditControls';
import ChatModal from './components/ChatModal';
import SaveDesignModal from './components/SaveDesignModal';
import SavedDesignsPanel from './components/SavedDesignsPanel';
import GenerateProductModal from './components/GenerateProductModal';
import StyleMatchModal from './components/StyleMatchModal';
import Toast from './components/Toast';

// Service and data imports
import { 
    generateCompositeImage, 
    generatePaintedScene, 
    generateRemovedObjectScene,
    generateObjectMask,
    applyMoveWithMask,
    generateInpaintedScene,
    generateEditedSceneFromText,
    generateEditedSceneWithMask,
} from './services/geminiService';
import { STOCK_PRODUCTS, STOCK_PAINTS, DESIGN_PACKS } from './data';
import { Product, PaintColor, DesignPack, Product3D, SavedDesign, ChatMessage, Product2D } from './types';


// Helper to convert data URL to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}


const App: React.FC = () => {
    // --- AUTHENTICATION STATE ---
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    // --- CORE APP STATE ---
    const [sceneImageFile, setSceneImageFile] = useState<File | null>(null);
    const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<Tool | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [lastPrompt, setLastPrompt] = useState<string | null>(null);

    // --- CATALOG & SELECTION STATE ---
    const [products, setProducts] = useState<Product[]>(STOCK_PRODUCTS);
    const [paints, setPaints] = useState<PaintColor[]>(STOCK_PAINTS);
    const [designPacks] = useState<DesignPack[]>(DESIGN_PACKS);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedPaint, setSelectedPaint] = useState<PaintColor | null>(null);
    const [selectedDesignPack, setSelectedDesignPack] = useState<DesignPack | null>(null);
    
    // --- DRAG & DROP STATE ---
    const [touchGhostPosition, setTouchGhostPosition] = useState<{ x: number; y: number } | null>(null);
    const sceneImageRef = useRef<HTMLImageElement>(null);
    
    // --- MODAL STATE ---
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [isAddPaintModalOpen, setIsAddPaintModalOpen] = useState(false);
    const [isModelViewerOpen, setIsModelViewerOpen] = useState(false);
    const [productFor3DView, setProductFor3DView] = useState<Product3D | null>(null);
    const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
    const [debugImageUrl, setDebugImageUrl] = useState<string | null>(null);
    const [debugPrompt, setDebugPrompt] = useState<string | null>(null);
    const [isMoveConfirmModalOpen, setIsMoveConfirmModalOpen] = useState(false);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [isSaveDesignModalOpen, setIsSaveDesignModalOpen] = useState(false);
    const [isGenerateProductModalOpen, setIsGenerateProductModalOpen] = useState(false);
    const [isStyleMatchModalOpen, setIsStyleMatchModalOpen] = useState(false);
    const [isSavedDesignsPanelOpen, setIsSavedDesignsPanelOpen] = useState(false);

    // --- INTERACTIVE EDITING STATE ---
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null); // For move/highlight mask preview
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(40);
    const [highlightPrompt, setHighlightPrompt] = useState('');
    const [textEditPrompt, setTextEditPrompt] = useState('');
    const [hasDrawingOccurred, setHasDrawingOccurred] = useState(false);

    // --- MOVE TOOL STATE ---
    const [moveMaskFile, setMoveMaskFile] = useState<File | null>(null);
    const [moveObjectCutout, setMoveObjectCutout] = useState<File | null>(null);
    const [isInpainting, setIsInpainting] = useState(false);

    // --- SAVED DESIGNS STATE ---
    const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);

    // --- EFFECT HOOKS ---
    useEffect(() => {
        // If supabase client failed to initialize, don't set up listeners.
        if (!supabase) {
            setIsAuthLoading(false);
            return;
        }

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            const newUser = session?.user ?? null;
            setUser(newUser);
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                if (newUser) loadUserDesigns();
            } else if (event === 'SIGNED_OUT') {
                setSavedDesigns([]); // Clear designs on logout
            }
            setIsAuthLoading(false);
        });

        // Check for initial session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) await loadUserDesigns();
            setIsAuthLoading(false);
        };
        checkSession();

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);


    useEffect(() => {
        if (sceneImageFile) {
            const objectUrl = URL.createObjectURL(sceneImageFile);
            setSceneImageUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else {
            setSceneImageUrl(null);
        }
    }, [sceneImageFile]);


    // --- DATA HANDLERS ---
    const loadUserDesigns = async () => {
        try {
            const designs = await fetchDesigns();
            setSavedDesigns(designs);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not load saved designs.";
            setError(message);
        }
    };

    const handleSaveDesign = async (name: string) => {
        if (!sceneImageFile) {
            setError("There is no scene image to save.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage('Saving your design...');
        setError(null);
        try {
            const newDesign = await uploadDesign(sceneImageFile, name, lastPrompt);
            setSavedDesigns(prev => [newDesign, ...prev]);
            setToastMessage(`Design "${name}" saved!`);
        } catch (e) {
            const message = e instanceof Error ? e.message : "An unknown error occurred while saving.";
            setError(message);
        } finally {
            setIsLoading(false);
            setIsSaveDesignModalOpen(false);
        }
    };

    const handleDeleteDesign = async (design: SavedDesign) => {
        try {
            await deleteDesign(design);
            setSavedDesigns(prev => prev.filter(d => d.id !== design.id));
            setToastMessage(`Deleted "${design.name}".`);
        } catch (e) {
             const message = e instanceof Error ? e.message : "An unknown error occurred while deleting.";
            setError(message);
        }
    };

    const handleLoadDesign = async (design: SavedDesign) => {
        setIsLoading(true);
        setLoadingMessage(`Loading "${design.name}"...`);
        try {
            const response = await fetch(design.dataUrl);
            const blob = await response.blob();
            const file = new File([blob], design.name, { type: blob.type });
            setSceneImageFile(file);
            setLastPrompt(design.prompt || null);
            setIsSavedDesignsPanelOpen(false); // Close panel after loading
        } catch (e) {
            const message = e instanceof Error ? e.message : "Could not load the design image.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- EVENT HANDLERS ---
    const handleLogin = async () => { 
        if (supabase) {
            await supabase.auth.signInWithOAuth({ 
                provider: 'google',
                // By removing the `redirectTo` option, Supabase will default to the 
                // "Site URL" configured in your project's authentication settings.
                // This is often more reliable than dynamically generating the URL on the client-side.
            }); 
        }
    };
    const handleLogout = async () => { 
        if (supabase) await supabase.auth.signOut(); 
    };

    const handleFileSelect = (file: File) => {
        setSceneImageFile(file);
        setIsAddProductModalOpen(false); // Close modal if open
    };
    
    const handleToolSelect = (tool: Tool) => {
        if (tool === 'save') {
            setIsSavedDesignsPanelOpen(p => !p);
            setActiveTool(null);
            return;
        }
        setIsSavedDesignsPanelOpen(false); // Close panel if another tool is selected
        setActiveTool(prev => prev === tool ? null : tool);
        setSelectedProduct(null);
        setSelectedPaint(null);
    };

    const handleImageDrop = useCallback(async (clientX: number, clientY: number) => {
        if (!sceneImageRef.current) return;
        setTouchGhostPosition(null);

        const rect = sceneImageRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
            console.log("Drop was outside the image bounds.");
            return;
        }

        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;
        const dropPosition = { xPercent, yPercent };

        // Handle different drop actions based on selected item
        if (selectedProduct && sceneImageFile) {
            setIsLoading(true);
            setLoadingMessage('Compositing product into scene...');
            setError(null);
            setActiveTool(null);
            
            try {
                const productUrl = selectedProduct.type === '2d' ? selectedProduct.imageUrl : selectedProduct.thumbnailUrl;
                const response = await fetch(productUrl);
                const blob = await response.blob();
                const objectImageFile = new File([blob], selectedProduct.name, { type: blob.type });

                const { finalImageUrl, debugImageUrl, finalPrompt } = await generateCompositeImage(
                    objectImageFile,
                    selectedProduct.name,
                    sceneImageFile,
                    "A home interior scene", // Simple description
                    dropPosition
                );
                
                setDebugImageUrl(debugImageUrl);
                setDebugPrompt(finalPrompt);
                setLastPrompt(finalPrompt);
                
                // Update scene with the new image
                const newSceneFile = dataURLtoFile(finalImageUrl, `scene-${Date.now()}.jpg`);
                setSceneImageFile(newSceneFile);

            } catch (e) {
                const message = e instanceof Error ? e.message : "An unknown error occurred.";
                setError(message);
            } finally {
                setIsLoading(false);
                setSelectedProduct(null);
            }
        } else if (selectedPaint && sceneImageFile) {
            setIsLoading(true);
            setLoadingMessage('Repainting the scene...');
            setError(null);
            setActiveTool(null);

            try {
                const { finalImageUrl, debugImageUrl, finalPrompt } = await generatePaintedScene(
                    sceneImageFile,
                    "A home interior scene",
                    selectedPaint,
                    dropPosition
                );
                setDebugImageUrl(debugImageUrl);
                setDebugPrompt(finalPrompt);
                setLastPrompt(finalPrompt);

                const newSceneFile = dataURLtoFile(finalImageUrl, `scene-painted-${Date.now()}.jpg`);
                setSceneImageFile(newSceneFile);

            } catch (e) {
                const message = e instanceof Error ? e.message : "An unknown error occurred.";
                setError(message);
            } finally {
                setIsLoading(false);
                setSelectedPaint(null);
            }
        } else if (activeTool === 'erase' && sceneImageFile) {
             setIsLoading(true);
            setLoadingMessage('Removing object from scene...');
            setError(null);
            setActiveTool(null);

             try {
                const { finalImageUrl, debugImageUrl, finalPrompt } = await generateRemovedObjectScene(
                    sceneImageFile,
                    dropPosition
                );
                setDebugImageUrl(debugImageUrl);
                setDebugPrompt(finalPrompt);
                setLastPrompt(finalPrompt);

                const newSceneFile = dataURLtoFile(finalImageUrl, `scene-erased-${Date.now()}.jpg`);
                setSceneImageFile(newSceneFile);

            } catch (e) {
                const message = e instanceof Error ? e.message : "An unknown error occurred.";
                setError(message);
            } finally {
                setIsLoading(false);
            }
        }
    }, [sceneImageFile, selectedProduct, selectedPaint, activeTool]);


    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (selectedProduct || selectedPaint) {
            const touch = e.touches[0];
            setTouchGhostPosition({ x: touch.clientX, y: touch.clientY });
        }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (selectedProduct || selectedPaint) {
            const touch = e.changedTouches[0];
            handleImageDrop(touch.clientX, touch.clientY);
        }
    };
    
    // ... lots more handlers for modals, drawing, etc.
    const handleAddProduct = (product: Product2D) => {
        setProducts(prev => [product, ...prev]);
        setToastMessage(`Added "${product.name}" to your products.`);
    };

    const handleAddPaint = (color: PaintColor) => {
        setPaints(prev => [color, ...prev]);
        setToastMessage(`Added "${color.name}" to your colors.`);
    };

    const handleView3DModel = (product: Product3D) => {
        setProductFor3DView(product);
        setIsModelViewerOpen(true);
    };

    const handleCapture3D = (file: File) => {
        const newProduct: Product2D = {
            type: '2d',
            id: `custom-${Date.now()}`,
            name: `${productFor3DView?.name || '3D Capture'} (View)`,
            imageUrl: URL.createObjectURL(file), // This should be handled more robustly
        };
        setProducts(prev => [newProduct, ...prev]);
        setIsModelViewerOpen(false);
        setToastMessage('Added 3D view to your products.');
    };

    const handleProductSelect = (product: Product) => {
        if (activeTool) setActiveTool(null);
        setSelectedPaint(null);
        setSelectedProduct(prev => prev?.id === product.id ? null : product);
    };
    
    const handlePaintSelect = (paint: PaintColor) => {
        if (activeTool) setActiveTool(null);
        setSelectedProduct(null);
        setSelectedPaint(prev => prev?.hex === paint.hex ? null : paint);
    };
    
    // A simplified render method
    return (
        <div className="w-screen h-screen bg-zinc-100 flex flex-col font-sans">
            <Header 
                user={user} 
                onLogin={handleLogin} 
                onLogout={handleLogout} 
                isLoginDisabled={!!supabaseError}
            />

            <main 
                className="flex-grow flex items-center justify-center relative"
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDrop={(e) => {
                    e.preventDefault();
                    if (selectedProduct || selectedPaint || activeTool === 'erase') handleImageDrop(e.clientX, e.clientY);
                }}
                onDragOver={(e) => e.preventDefault()}
            >
                {isLoading && (
                    <div className="absolute inset-0 bg-black/50 z-30 flex flex-col items-center justify-center">
                        <Spinner />
                        <p className="mt-4 text-white font-bold">{loadingMessage}</p>
                    </div>
                )}
                
                {error && (
                     <div className="absolute top-4 max-w-lg bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-40" role="alert">
                        <strong className="font-bold">Error:</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                        <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                        </button>
                    </div>
                )}

                {!sceneImageUrl ? (
                    <div className="w-full max-w-2xl px-4">
                        <ImageUploader id="scene-uploader" onFileSelect={handleFileSelect} imageUrl={null} />
                    </div>
                ) : (
                    <img ref={sceneImageRef} src={sceneImageUrl} alt="Your Scene" className="max-w-full max-h-full object-contain" />
                )}

                {sceneImageUrl && (
                    <Toolbar 
                        activeTool={activeTool} 
                        onToolSelect={handleToolSelect} 
                        isSceneImagePresent={!!sceneImageUrl}
                        onSaveAsClick={() => setIsSaveDesignModalOpen(true)} 
                    />
                )}
                
                 {(activeTool === 'add' || activeTool === 'paint' || selectedProduct || selectedPaint) && (
                    <Catalog 
                        products={products}
                        paints={paints}
                        designPacks={designPacks}
                        selectedItems={{ product: selectedProduct, paint: selectedPaint, pack: selectedDesignPack }}
                        onProductSelect={handleProductSelect}
                        onPaintSelect={handlePaintSelect}
                        onDesignPackSelect={pack => {}}
                        onAddProductClick={() => setIsAddProductModalOpen(true)}
                        onAddPaintClick={() => setIsAddPaintModalOpen(true)}
                        onRemoveCustomProduct={product => setProducts(prev => prev.filter(p => p.id !== product.id))}
                        onRemoveCustomPaint={paint => setPaints(prev => prev.filter(p => p.hex !== paint.hex))}
                        onView3DModel={handleView3DModel}
                        onGenerateProductClick={() => setIsGenerateProductModalOpen(true)}
                        onStyleMatchClick={() => setIsStyleMatchModalOpen(true)}
                    />
                )}
            </main>
            
            <TouchGhost 
                imageUrl={selectedProduct ? (selectedProduct.type === '2d' ? selectedProduct.imageUrl : selectedProduct.thumbnailUrl) : null}
                position={touchGhostPosition} 
            />
            
            <SavedDesignsPanel
                isOpen={isSavedDesignsPanelOpen}
                designs={savedDesigns}
                onClose={() => setIsSavedDesignsPanelOpen(false)}
                onLoadDesign={handleLoadDesign}
                onDeleteDesign={handleDeleteDesign}
            />

            {/* --- Modals --- */}
            <AddProductModal 
                isOpen={isAddProductModalOpen} 
                onClose={() => setIsAddProductModalOpen(false)} 
                onFileSelect={(file) => {
                    const newProduct: Product = { type: '2d', id: `custom-${Date.now()}`, name: file.name, imageUrl: URL.createObjectURL(file) };
                    setProducts(prev => [newProduct, ...prev]);
                    setIsAddProductModalOpen(false);
                }}
            />
            <AddPaintModal 
                isOpen={isAddPaintModalOpen}
                onClose={() => setIsAddPaintModalOpen(false)}
                onColorSelect={handleAddPaint}
            />
             <ModelViewerModal 
                isOpen={isModelViewerOpen}
                onClose={() => setIsModelViewerOpen(false)}
                product={productFor3DView}
                onCapture={handleCapture3D}
            />
            <SaveDesignModal
                isOpen={isSaveDesignModalOpen}
                onClose={() => setIsSaveDesignModalOpen(false)}
                onSave={handleSaveDesign}
                isLoading={isLoading}
            />
            <GenerateProductModal
                isOpen={isGenerateProductModalOpen}
                onClose={() => setIsGenerateProductModalOpen(false)}
                onAddProduct={handleAddProduct}
            />
            <StyleMatchModal
                isOpen={isStyleMatchModalOpen}
                onClose={() => setIsStyleMatchModalOpen(false)}
                onAddProduct={handleAddProduct}
                onAddPaintColor={handleAddPaint}
            />
            <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        </div>
    );
};

export default App;