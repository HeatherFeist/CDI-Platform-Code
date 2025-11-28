
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Product3D } from '../types';
import Spinner from './Spinner';

interface ModelViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product3D | null;
  onCapture: (file: File) => void;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Helper to convert a data URL string to a File object, needed for capturing canvas
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

const ModelViewerModal: React.FC<ModelViewerModalProps> = ({ isOpen, onClose, product, onCapture }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = useCallback(() => {
    if (rendererRef.current) {
      try {
        const renderer = rendererRef.current;
        // Ensure the scene is rendered before capturing
        // This is implicitly handled by the animation loop, but can be called explicitly if needed
        const dataURL = renderer.domElement.toDataURL('image/png');
        const file = dataURLtoFile(dataURL, `${product?.name || 'capture'}.png`);
        onCapture(file);
      } catch (e) {
        console.error("Failed to capture canvas:", e);
        setError("Could not capture the model view. Your browser might not support this feature.");
      }
    }
  }, [product, onCapture]);
  
  useEffect(() => {
    if (!isOpen || !product || !mountRef.current) {
        return;
    }
    
    setIsLoading(true);
    setError(null);
    let animationFrameId: number;

    const currentMount = mountRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 2;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // Transparent background
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 5;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Model Loader
    const loader = new GLTFLoader();
    loader.load(
        product.modelUrl,
        (gltf) => {
            const model = gltf.scene;
            
            // Auto-center and scale model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 1.5 / maxDim; // Scale to fit nicely in a ~1.5 unit space
            
            model.scale.set(scale, scale, scale);
            model.position.sub(center.multiplyScalar(scale));
            
            scene.add(model);
            setIsLoading(false);
        },
        undefined, // onProgress callback (optional)
        (error) => {
            console.error('An error happened while loading the model:', error);
            setError('Failed to load 3D model. Please check the model URL or try again.');
            setIsLoading(false);
        }
    );

    // Animation loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
        if (currentMount) {
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        }
    };
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      rendererRef.current = null;
      // You can also dispose geometries, materials, textures here if needed for larger apps
    };

  }, [isOpen, product]);

  if (!isOpen) {
    return null;
  }
  
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 md:p-8 relative transform transition-all flex flex-col gap-4"
        style={{ height: '80vh', maxHeight: '700px' }}
        onClick={handleModalContentClick}
        role="document"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 transition-colors z-20"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
        <div className="text-center flex-shrink-0">
          <h2 className="text-2xl font-extrabold text-zinc-800">3D Model Viewer</h2>
          <p className="text-zinc-500 text-sm">Rotate and zoom the model to get the perfect view.</p>
        </div>
        
        <div ref={mountRef} className="w-full h-full bg-zinc-100 rounded-lg relative overflow-hidden flex-grow">
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-zinc-100/80">
                    <Spinner />
                    <p className="mt-4 text-zinc-600">Loading 3D model...</p>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-red-50 p-4">
                    <p className="text-red-700 text-center">{error}</p>
                </div>
            )}
        </div>

        <button
            onClick={handleCapture}
            disabled={isLoading || !!error}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-md shadow-sm text-white bg-zinc-800 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            title="Capture this orientation as a 2D image"
        >
            Use this View
        </button>
      </div>
    </div>
  );
};

export default ModelViewerModal;
