/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI, GenerateContentResponse, Modality, Type, Chat } from "@google/genai";
import { geminiError } from '../supabase';
import { PaintColor, Product2D } from "../types";

// --- API KEY MANAGEMENT ---
let _geminiApiKey: string | null = null;
export function setGeminiApiKey(key: string) {
    _geminiApiKey = key;
}
function getGeminiApiKey(): string {
    if (_geminiApiKey) return _geminiApiKey;
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) return process.env.API_KEY;
    throw new Error('Gemini API key is not set.');
}

// Helper to convert a data URL string to a File object
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

// Helper to get intrinsic image dimensions from a File object
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read file."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                resolve({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.onerror = (err) => reject(new Error(`Image load error: ${err}`));
        };
        reader.onerror = (err) => reject(new Error(`File reader error: ${err}`));
    });
};

// Helper to crop a square image back to an original aspect ratio, removing padding.
const cropToOriginalAspectRatio = (
    imageDataUrl: string,
    originalWidth: number,
    originalHeight: number,
    targetDimension: number
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imageDataUrl;
        img.onload = () => {
            // Re-calculate the dimensions of the content area within the padded square image
            const aspectRatio = originalWidth / originalHeight;
            let contentWidth, contentHeight;
            if (aspectRatio > 1) { // Landscape
                contentWidth = targetDimension;
                contentHeight = targetDimension / aspectRatio;
            } else { // Portrait or square
                contentHeight = targetDimension;
                contentWidth = targetDimension * aspectRatio;
            }

            // Calculate the top-left offset of the content area
            const x = (targetDimension - contentWidth) / 2;
            const y = (targetDimension - contentHeight) / 2;

            const canvas = document.createElement('canvas');
            // Set canvas to the final, un-padded dimensions
            canvas.width = contentWidth;
            canvas.height = contentHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context for cropping.'));
            }
            
            // Draw the relevant part of the square generated image onto the new, smaller canvas
            ctx.drawImage(img, x, y, contentWidth, contentHeight, 0, 0, contentWidth, contentHeight);
            
            // Return the data URL of the newly cropped image
            resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        img.onerror = (err) => reject(new Error(`Image load error during cropping: ${err}`));
    });
};


// New resize logic inspired by the reference to enforce a consistent aspect ratio without cropping.
// It resizes the image to fit within a square and adds padding, ensuring a consistent
// input size for the AI model, which enhances stability.
const resizeImage = (file: File, targetDimension: number): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read file."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = targetDimension;
                canvas.height = targetDimension;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context.'));
                }

                // Fill the canvas with a neutral background to avoid transparency issues
                // and ensure a consistent input format for the model.
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, targetDimension, targetDimension);

                // Calculate new dimensions to fit inside the square canvas while maintaining aspect ratio
                const aspectRatio = img.width / img.height;
                let newWidth, newHeight;

                if (aspectRatio > 1) { // Landscape image
                    newWidth = targetDimension;
                    newHeight = targetDimension / aspectRatio;
                } else { // Portrait or square image
                    newHeight = targetDimension;
                    newWidth = targetDimension * aspectRatio;
                }

                // Calculate position to center the image on the canvas
                const x = (targetDimension - newWidth) / 2;
                const y = (targetDimension - newHeight) / 2;
                
                // Draw the resized image onto the centered position
                ctx.drawImage(img, x, y, newWidth, newHeight);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name, {
                            type: 'image/jpeg', // Force jpeg to handle padding color consistently
                            lastModified: Date.now()
                        }));
                    } else {
                        reject(new Error('Canvas to Blob conversion failed.'));
                    }
                }, 'image/jpeg', 0.95);
            };
            img.onerror = (err) => reject(new Error(`Image load error: ${err}`));
        };
        reader.onerror = (err) => reject(new Error(`File reader error: ${err}`));
    });
};

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

// Helper to convert File to a data URL string
const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// Helper to draw a marker on an image and return a new File object
const markImage = async (
    paddedSquareFile: File, 
    position: { xPercent: number; yPercent: number; },
    originalDimensions: { originalWidth: number; originalHeight: number; }
): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(paddedSquareFile);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read file for marking."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const targetDimension = canvas.width;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context for marking.'));
                }

                // Draw the original (padded) image
                ctx.drawImage(img, 0, 0);

                // Recalculate the content area's dimensions and offset within the padded square canvas.
                // This is crucial to translate the content-relative percentages to the padded canvas coordinates.
                const { originalWidth, originalHeight } = originalDimensions;
                const aspectRatio = originalWidth / originalHeight;
                let contentWidth, contentHeight;

                if (aspectRatio > 1) { // Landscape
                    contentWidth = targetDimension;
                    contentHeight = targetDimension / aspectRatio;
                } else { // Portrait or square
                    contentHeight = targetDimension;
                    contentWidth = targetDimension * aspectRatio;
                }
                
                const offsetX = (targetDimension - contentWidth) / 2;
                const offsetY = (targetDimension - contentHeight) / 2;

                // Calculate the marker's coordinates relative to the actual image content
                const markerXInContent = (position.xPercent / 100) * contentWidth;
                const markerYInContent = (position.yPercent / 100) * contentHeight;

                // The final position on the canvas is the content's offset plus the relative position
                const finalMarkerX = offsetX + markerXInContent;
                const finalMarkerY = offsetY + markerYInContent;

                // Make radius proportional to image size, but with a minimum
                const markerRadius = Math.max(5, Math.min(canvas.width, canvas.height) * 0.015);

                // Draw the marker (red circle with white outline) at the corrected coordinates
                ctx.beginPath();
                ctx.arc(finalMarkerX, finalMarkerY, markerRadius, 0, 2 * Math.PI, false);
                ctx.fillStyle = 'red';
                ctx.fill();
                ctx.lineWidth = markerRadius * 0.2;
                ctx.strokeStyle = 'white';
                ctx.stroke();

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], `marked-${paddedSquareFile.name}`, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        }));
                    } else {
                        reject(new Error('Canvas to Blob conversion failed during marking.'));
                    }
                }, 'image/jpeg', 0.95);
            };
            img.onerror = (err) => reject(new Error(`Image load error during marking: ${err}`));
        };
        reader.onerror = (err) => reject(new Error(`File reader error during marking: ${err}`));
    });
};


/**
 * Generates a composite image using a multi-modal AI model.
 * The model takes a product image, a scene image, and a text prompt
 * to generate a new image with the product in the scene.
 * @param objectImage The file for the object to be placed.
 * @param objectDescription A text description of the object.
 * @param environmentImage The file for the background environment.
 * @param environmentDescription A text description of the environment.
 * @param dropPosition The relative x/y coordinates (0-100) where the product was dropped.
 * @returns A promise that resolves to an object containing the base64 data URL of the generated image and the debug image.
 */
export const generateCompositeImage = async (
    objectImage: File, 
    objectDescription: string,
    environmentImage: File,
    environmentDescription: string,
    dropPosition: { xPercent: number; yPercent: number; }
): Promise<{ finalImageUrl: string; debugImageUrl: string; finalPrompt: string; }> => {
  if (geminiError) return Promise.reject(new Error(geminiError));
  console.log('Starting multi-step image generation process...');
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

  // Get original scene dimensions for final cropping and correct marker placement
  const { width: originalWidth, height: originalHeight } = await getImageDimensions(environmentImage);
  
  // Define standard dimension for model inputs
  const MAX_DIMENSION = 1024;
  
  // STEP 1: Prepare images by resizing
  console.log('Resizing product and scene images...');
  const resizedObjectImage = await resizeImage(objectImage, MAX_DIMENSION);
  const resizedEnvironmentImage = await resizeImage(environmentImage, MAX_DIMENSION);

  // STEP 2: Mark the resized scene image for the description model and debug view
  console.log('Marking scene image for analysis...');
  // Pass original dimensions to correctly calculate marker position on the padded image
  const markedResizedEnvironmentImage = await markImage(resizedEnvironmentImage, dropPosition, { originalWidth, originalHeight });

  // The debug image is now the marked one.
  const debugImageUrl = await fileToDataUrl(markedResizedEnvironmentImage);


  // STEP 3: Generate semantic location description with Gemini 2.5 Flash using the MARKED image
  console.log('Generating semantic location description with gemini-2.5-flash...');
  
  const markedEnvironmentImagePart = await fileToPart(markedResizedEnvironmentImage);

  const descriptionPrompt = `
You are an expert scene analyst. I will provide you with an image that has a red marker on it.
Your task is to provide a very dense, semantic description of what is at the exact location of the red marker.
Be specific about surfaces, objects, and spatial relationships. This description will be used to guide another AI in placing a new object.

Example semantic descriptions:
- "The product location is on the dark grey fabric of the sofa cushion, in the middle section, slightly to the left of the white throw pillow."
- "The product location is on the light-colored wooden floor, in the patch of sunlight coming from the window, about a foot away from the leg of the brown leather armchair."
- "The product location is on the white marble countertop, just to the right of the stainless steel sink and behind the green potted plant."

On top of the semantic description above, give a rough relative-to-image description.

Example relative-to-image descriptions:
- "The product location is about 10% away from the bottom-left of the image."
- "The product location is about 20% away from the right of the image."

Provide only the two descriptions concatenated in a few sentences.
`;
  
  let semanticLocationDescription = '';
  try {
    const descriptionResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: descriptionPrompt }, markedEnvironmentImagePart] }
    });
    semanticLocationDescription = descriptionResponse.text;
    console.log('Generated description:', semanticLocationDescription);
  } catch (error) {
    console.error('Failed to generate semantic location description:', error);
    // Fallback to a generic statement if the description generation fails
    semanticLocationDescription = `at the specified location.`;
  }

  // STEP 4: Generate composite image using the CLEAN image and the description
  console.log('Preparing to generate composite image...');
  
  const objectImagePart = await fileToPart(resizedObjectImage);
  const cleanEnvironmentImagePart = await fileToPart(resizedEnvironmentImage); // IMPORTANT: Use clean image
  
  const prompt = `
**Role:**
You are a visual composition expert. Your task is to take a 'product' image and seamlessly integrate it into a 'scene' image. Your highest priority is photorealism and **faithfully preserving the visual details of the product image**.

**Specifications:**
-   **Product Image:**
    The first image provided. This contains the product to be added. It may be surrounded by black padding, which you should ignore and treat as transparent.
-   **Scene Image:**
    The second image provided. This is the environment where the product will be placed. It may also be surrounded by black padding, which you should ignore.
-   **Placement Instruction (Crucial):**
    -   You must place the product at the location described here: "${semanticLocationDescription}".
-   **Integration Rules (Crucial):**
    -   You MUST use the **exact visual appearance, pattern, texture, and colors** from the product image.
    -   Do NOT invent a new pattern, texture, or product. Your task is to integrate the *specific product shown* in the first image.
    -   You must intelligently drape, wrap, or place the product onto the target surface or object in the scene, making it conform realistically to the scene's shapes, folds, and perspective.
    -   For example, if the product is a comforter and the target is a bed, the comforter's pattern must be draped over the bed, following its contours. If the product is a lamp, it should be placed on a surface.
-   **Final Image Requirements:**
    -   The final composite must be **indistinguishable from a real photograph**.
    -   The product must be scaled appropriately for the scene.
    -   The integration must perfectly match the scene's lighting, casting realistic shadows and receiving realistic highlights. Pay meticulous attention to **micro-shadows, ambient occlusion, and color bleeding** from surrounding objects.
    -   The product's material properties must be rendered accurately under the scene's lighting conditions.

The output should ONLY be the final, composed image. Do not add any text or explanation.
`;

  const textPart = { text: prompt };
  
  console.log('Sending images and augmented prompt...');
  
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [objectImagePart, cleanEnvironmentImagePart, textPart] },
    config: {
        responseModalities: [Modality.IMAGE],
    },
  });

  console.log('Received response.');
  
  const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

  if (imagePartFromResponse?.inlineData) {
    const { mimeType, data } = imagePartFromResponse.inlineData;
    console.log(`Received image data (${mimeType}), length:`, data.length);
    const generatedSquareImageUrl = `data:${mimeType};base64,${data}`;
    
    console.log('Cropping generated image to original aspect ratio...');
    const finalImageUrl = await cropToOriginalAspectRatio(
        generatedSquareImageUrl,
        originalWidth,
        originalHeight,
        MAX_DIMENSION
    );
    
    return { finalImageUrl, debugImageUrl, finalPrompt: prompt };
  }

  console.error("Model response did not contain an image part.", response);
  throw new Error("The AI model did not return an image. Please try again.");
};

export const generatePaintedScene = async (
    environmentImage: File,
    environmentDescription: string,
    color: { name: string; hex: string; },
    dropPosition: { xPercent: number; yPercent: number; }
): Promise<{ finalImageUrl: string; debugImageUrl: string; finalPrompt: string; }> => {
  if (geminiError) return Promise.reject(new Error(geminiError));
  console.log('Starting multi-step image paint process...');
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

  const { width: originalWidth, height: originalHeight } = await getImageDimensions(environmentImage);
  const MAX_DIMENSION = 1024;
  
  console.log('Resizing scene image...');
  const resizedEnvironmentImage = await resizeImage(environmentImage, MAX_DIMENSION);

  console.log('Marking scene image for analysis...');
  const markedResizedEnvironmentImage = await markImage(resizedEnvironmentImage, dropPosition, { originalWidth, originalHeight });
  const debugImageUrl = await fileToDataUrl(markedResizedEnvironmentImage);
  
  // STEP 3: Generate semantic location description
  console.log('Generating semantic location description for painting...');
  const markedEnvironmentImagePart = await fileToPart(markedResizedEnvironmentImage);
  
  const descriptionPrompt = `
You are an expert scene analyst. I will provide you with an image that has a red marker on it.
Your task is to provide a very dense, semantic description of what object or surface is at the exact location of the red marker.
Be specific about surfaces, objects, and spatial relationships. This description will be used to guide another AI in repainting that area.

Example semantic descriptions:
- "The area to be painted is the back wall of the living room, behind the grey sofa."
- "The area to be painted is the front of the wooden kitchen cabinet located under the countertop."
- "The area to be painted is the fabric of the lampshade on the floor lamp next to the window."

Provide only the description of the object/surface at the marker.
`;

  let semanticLocationDescription = '';
  try {
    const descriptionResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: descriptionPrompt }, markedEnvironmentImagePart] }
    });
    semanticLocationDescription = descriptionResponse.text;
    console.log('Generated description for painting:', semanticLocationDescription);
  } catch (error) {
    console.error('Failed to generate semantic location description for painting:', error);
    semanticLocationDescription = `the area at the specified location`;
  }

  // STEP 4: Generate painted image using the CLEAN image
  console.log('Preparing to generate painted scene...');
  const cleanEnvironmentImagePart = await fileToPart(resizedEnvironmentImage);
  
  const prompt = `
**Role:**
You are a digital interior designer and expert photo editor. Your task is to repaint a specific part of a scene image with a new color, ensuring the result is photorealistic.

**Specifications:**
-   **Scene to edit:**
    The image provided. It may be surrounded by black padding, which you should ignore.
-   **Area to repaint (Crucial):**
    -   You must repaint the object or surface described here: "${semanticLocationDescription}".
    -   Do not paint any other part of the image.
-   **New Color:**
    -   Apply this color: ${color.name} (Hex: ${color.hex}).
-   **Final Image Requirements:**
    -   The repainted area must retain its original material texture, lighting, shadows, and highlights. The paint should look like a real coat of paint on the specified material. For example, paint on wood should show the original wood grain underneath, and paint on metal should have appropriate specularity.
    -   Ensure the new color interacts realistically with the scene's lighting, showing subtle variations in tone across highlights, midtones, and shadows.
    -   The final image must be completely photorealistic, as if the object was originally that color.
    -   The output image's style and camera perspective must exactly match the original scene.
    -   Do not return the original image. The specified area must be repainted.

The output should ONLY be the final, edited image. Do not add any text or explanation.
`;

  const textPart = { text: prompt };
  
  console.log('Sending images and augmented prompt for painting...');
  
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [cleanEnvironmentImagePart, textPart] },
    config: {
        responseModalities: [Modality.IMAGE],
    },
  });

  console.log('Received painted response.');
  
  const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

  if (imagePartFromResponse?.inlineData) {
    const { mimeType, data } = imagePartFromResponse.inlineData;
    console.log(`Received painted image data (${mimeType}), length:`, data.length);
    const generatedSquareImageUrl = `data:${mimeType};base64,${data}`;
    
    console.log('Cropping painted image to original aspect ratio...');
    const finalImageUrl = await cropToOriginalAspectRatio(
        generatedSquareImageUrl,
        originalWidth,
        originalHeight,
        MAX_DIMENSION
    );
    
    return { finalImageUrl, debugImageUrl, finalPrompt: prompt };
  }

  console.error("Model response for painting did not contain an image part.", response);
  throw new Error("The AI model did not return a painted image. Please try again.");
};

export const generateRemovedObjectScene = async (
    environmentImage: File,
    dropPosition: { xPercent: number; yPercent: number; }
): Promise<{ finalImageUrl: string; debugImageUrl: string; finalPrompt: string; }> => {
  if (geminiError) return Promise.reject(new Error(geminiError));
  console.log('Starting multi-step object removal process...');
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

  const { width: originalWidth, height: originalHeight } = await getImageDimensions(environmentImage);
  const MAX_DIMENSION = 1024;
  
  console.log('Resizing scene image...');
  const resizedEnvironmentImage = await resizeImage(environmentImage, MAX_DIMENSION);

  console.log('Marking scene image for analysis...');
  const markedResizedEnvironmentImage = await markImage(resizedEnvironmentImage, dropPosition, { originalWidth, originalHeight });
  const debugImageUrl = await fileToDataUrl(markedResizedEnvironmentImage);
  
  // STEP 3: Generate semantic location description
  console.log('Generating semantic location description for removal...');
  const markedEnvironmentImagePart = await fileToPart(markedResizedEnvironmentImage);
  
  const descriptionPrompt = `
You are an expert scene analyst. I will provide you with an image that has a red marker on it.
Your task is to provide a very dense, semantic description of the object located at the red marker.
Be specific about the object. This description will be used to guide another AI in removing that object.

Example semantic descriptions:
- "The object to remove is the tall, green potted plant standing on the floor next to the window."
- "The object to remove is the blue patterned throw pillow on the left side of the grey sofa."
- "The object to remove is the silver table lamp on the wooden side table."

Provide only the description of the object at the marker.
`;

  let semanticLocationDescription = '';
  try {
    const descriptionResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: descriptionPrompt }, markedEnvironmentImagePart] }
    });
    semanticLocationDescription = descriptionResponse.text;
    console.log('Generated description for removal:', semanticLocationDescription);
  } catch (error) {
    console.error('Failed to generate semantic location description for removal:', error);
    semanticLocationDescription = `the object at the specified location`;
  }

  // STEP 4: Generate edited image using the CLEAN image
  console.log('Preparing to generate object removal scene...');
  const cleanEnvironmentImagePart = await fileToPart(resizedEnvironmentImage);
  
  const prompt = `
**Role:**
You are a professional photo retoucher. Your task is to remove an object from a scene and realistically fill in the background behind it.

**Specifications:**
-   **Scene to edit:**
    The image provided. It may be surrounded by black padding, which you should ignore.
-   **Object to remove (Crucial):**
    -   You must remove the object described here: "${semanticLocationDescription}".
    -   Do not remove any other objects from the image.
-   **Final Image Requirements:**
    -   The area where the object was removed must be seamlessly filled in. The filled-in area must be **structurally and texturally coherent** with the surrounding environment. For example, if removing an object from a wooden floor, the wood grain and planks must continue logically into the filled space.
    -   The result must be completely photorealistic, as if the object was never there.
    -   Avoid any smudging, blurring, or repetitive patterns. The goal is a **perfect, invisible repair**.
    -   Do not leave any artifacts or empty spaces.
    -   Do not return the original image. The specified object must be removed.

The output should ONLY be the final, edited image. Do not add any text or explanation.
`;

  const textPart = { text: prompt };
  
  console.log('Sending images and augmented prompt for removal...');
  
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [cleanEnvironmentImagePart, textPart] },
    config: {
        responseModalities: [Modality.IMAGE],
    },
  });

  console.log('Received removed object response.');
  
  const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

  if (imagePartFromResponse?.inlineData) {
    const { mimeType, data } = imagePartFromResponse.inlineData;
    console.log(`Received removed object image data (${mimeType}), length:`, data.length);
    const generatedSquareImageUrl = `data:${mimeType};base64,${data}`;
    
    console.log('Cropping removed object image to original aspect ratio...');
    const finalImageUrl = await cropToOriginalAspectRatio(
        generatedSquareImageUrl,
        originalWidth,
        originalHeight,
        MAX_DIMENSION
    );
    
    return { finalImageUrl, debugImageUrl, finalPrompt: prompt };
  }

  console.error("Model response for removal did not contain an image part.", response);
  throw new Error("The AI model did not return an edited image. Please try again.");
};

export const generateInpaintedScene = async (
    environmentImage: File,
    maskImage: File
): Promise<{ finalImageUrl: string; finalPrompt: string; }> => {
    if (geminiError) return Promise.reject(new Error(geminiError));
    console.log('Starting inpainting process...');
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

    const { width: originalWidth, height: originalHeight } = await getImageDimensions(environmentImage);
    const MAX_DIMENSION = 1024;
    
    console.log('Resizing scene and mask images...');
    const resizedEnvironmentImage = await resizeImage(environmentImage, MAX_DIMENSION);
    const resizedMaskImage = await resizeImage(maskImage, MAX_DIMENSION);
    
    const environmentImagePart = await fileToPart(resizedEnvironmentImage);
    const maskImagePart = await fileToPart(resizedMaskImage);
    
    const prompt = `
**Role:**
You are a professional photo retoucher. You will be given a 'scene' image and a 'mask' image.

**Task:**
Your task is to perform an inpainting operation. You must realistically remove everything from the 'scene' image that corresponds to the white area in the 'mask' image.

**Specifications:**
-   **Scene Image:** The first image provided.
-   **Mask Image:** The second image provided. The white area indicates the region to be removed and filled.
-   **Inpainting Requirement:**
    -   Fill the removed area by seamlessly extending the surrounding background. The filled-in area must be **structurally and texturally coherent** with the environment. For example, if on a wall, the wall texture must continue logically. If on a floor, floorboards or tiles should line up.
    -   The final result must be completely photorealistic, as if the masked objects were never there.
    -   Pay close attention to recreating the lighting and shadows that would exist if the object were not there. Avoid any smudging, blurring, or repetitive patterns. The goal is a **perfect, invisible repair**.
    -   Do not alter any area of the image outside the masked region.

The output should ONLY be the final, edited image. Do not add any text or explanation.
`;

    const textPart = { text: prompt };
    
    console.log('Sending images and prompt for inpainting...');
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [environmentImagePart, maskImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    console.log('Received inpainting response.');
    
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        const generatedSquareImageUrl = `data:${mimeType};base64,${data}`;
        
        console.log('Cropping inpainted image to original aspect ratio...');
        const finalImageUrl = await cropToOriginalAspectRatio(
            generatedSquareImageUrl,
            originalWidth,
            originalHeight,
            MAX_DIMENSION
        );
        
        return { finalImageUrl, finalPrompt: prompt };
    }

    console.error("Model response for inpainting did not contain an image part.", response);
    throw new Error("The AI model did not return an inpainted image. Please try again.");
};

export const generateEditedSceneFromText = async (
    environmentImage: File,
    textPrompt: string
): Promise<{ finalImageUrl: string; finalPrompt: string; }> => {
    if (geminiError) return Promise.reject(new Error(geminiError));
    console.log('Starting text-based image editing process...');
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

    const { width: originalWidth, height: originalHeight } = await getImageDimensions(environmentImage);
    const MAX_DIMENSION = 1024;
    
    console.log('Resizing scene image...');
    const resizedEnvironmentImage = await resizeImage(environmentImage, MAX_DIMENSION);
    
    const environmentImagePart = await fileToPart(resizedEnvironmentImage);
    
    const prompt = `
**Role:**
You are a master photo editor and visual artist. Your task is to edit a provided scene image based on a user's text description.

**Specifications:**
-   **Scene to edit:**
    The image provided. It may be surrounded by black padding, which you should ignore.
-   **Edit Instruction (Crucial):**
    -   You must perform the following edit: "${textPrompt}".
-   **Final Image Requirements:**
    -   Your highest priority is **photorealism**. The final image must look like a real photograph, not a digital manipulation.
    -   Ensure all new or modified elements perfectly match the scene's existing lighting, shadows, color grading, perspective, and depth of field.
    -   Interpret the user's request creatively but realistically. The changes should feel plausible within the context of the scene.
    -   The edited image must be seamlessly integrated.
    -   Maintain the original image's style and camera perspective unless the prompt explicitly asks to change them.
    -   Do not return the original image. The specified edit must be applied.

The output should ONLY be the final, edited image. Do not add any text or explanation.
`;

    const textPart = { text: prompt };
    
    console.log('Sending image and text prompt for editing...');
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [environmentImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    console.log('Received edited response.');
    
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received edited image data (${mimeType}), length:`, data.length);
        const generatedSquareImageUrl = `data:${mimeType};base64,${data}`;
        
        console.log('Cropping edited image to original aspect ratio...');
        const finalImageUrl = await cropToOriginalAspectRatio(
            generatedSquareImageUrl,
            originalWidth,
            originalHeight,
            MAX_DIMENSION
        );
        
        return { finalImageUrl, finalPrompt: prompt };
    }

    console.error("Model response for text edit did not contain an image part.", response);
    throw new Error("The AI model did not return an edited image. Please try again.");
};

export const generateEditedSceneWithMask = async (
    environmentImage: File,
    maskImage: File,
    textPrompt: string
): Promise<{ finalImageUrl: string; finalPrompt: string; }> => {
    if (geminiError) return Promise.reject(new Error(geminiError));
    console.log('Starting masked image editing process...');
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

    const { width: originalWidth, height: originalHeight } = await getImageDimensions(environmentImage);
    const MAX_DIMENSION = 1024;
    
    console.log('Resizing scene and mask images...');
    const resizedEnvironmentImage = await resizeImage(environmentImage, MAX_DIMENSION);
    const resizedMaskImage = await resizeImage(maskImage, MAX_DIMENSION);
    
    const environmentImagePart = await fileToPart(resizedEnvironmentImage);
    const maskImagePart = await fileToPart(resizedMaskImage);
    
    const prompt = `
**Role:**
You are a master photo editor and visual artist. You will be given a 'scene' image, a 'mask' image, and a text prompt.

**Task:**
Your task is to edit the 'scene' image based on the text prompt, but you MUST confine your edits to the area indicated by the white region in the 'mask' image.

**Specifications:**
-   **Scene Image:** The first image provided.
-   **Mask Image:** The second image provided. The white area indicates the only region you are allowed to edit. The black area must remain untouched.
-   **Edit Instruction (Crucial):**
    -   Perform this edit: "${textPrompt}".
-   **Final Image Requirements:**
    -   Apply the edit only within the masked area. Your highest priority is photorealism.
    -   The edited area must be photorealistic and seamlessly blended with the rest of the image. The transition between the edited (masked) area and the original image must be **completely seamless and undetectable**.
    -   All edits within the mask must respect the existing lighting, shadows, textures, and perspective of the underlying objects.
    -   Maintain the original image's style, lighting, shadows, and perspective for the unedited parts.
    -   The final result must be a single, coherent image.

The output should ONLY be the final, edited image. Do not add any text or explanation.
`;

    const textPart = { text: prompt };
    
    console.log('Sending images and prompt for masked editing...');
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [environmentImagePart, maskImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    console.log('Received masked edit response.');
    
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        const generatedSquareImageUrl = `data:${mimeType};base64,${data}`;
        
        console.log('Cropping masked edit image to original aspect ratio...');
        const finalImageUrl = await cropToOriginalAspectRatio(
            generatedSquareImageUrl,
            originalWidth,
            originalHeight,
            MAX_DIMENSION
        );
        
        return { finalImageUrl, finalPrompt: prompt };
    }

    console.error("Model response for masked editing did not contain an image part.", response);
    throw new Error("The AI model did not return an edited image. Please try again.");
};


// --- Move Object Feature ---

// Internal helper to get a segmentation mask from the model
async function _generateMaskFromModel(
    markedSceneImage: File,
): Promise<File> {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const imagePart = await fileToPart(markedSceneImage);
    const prompt = `
**Role:**
You are a precision image segmentation expert. You will be given a scene image with a red marker on it.

**Task:**
Your task is to identify the primary, distinct object located at the red marker and create a precise binary mask for it.

**Specifications:**
-   **Input Image:** A scene with a red marker indicating the object of interest.
-   **Output Image (Mask):**
    -   You MUST return an image of the exact same dimensions as the input.
    -   The object identified at the marker MUST be solid white (#FFFFFF).
    -   Everything else in the image, including the background, MUST be solid black (#000000).
    -   The mask should be clean, with no anti-aliasing (hard edges).
    -   Do not include the red marker in the output mask.

The output should ONLY be the final mask image. Do not add any text or explanation.`;
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePartFromResponse?.inlineData) throw new Error("Mask generation from model failed.");
    
    const { mimeType, data } = imagePartFromResponse.inlineData;
    const dataUrl = `data:${mimeType};base64,${data}`;
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], 'mask.png', { type: 'image/png' });
}

// Internal helper to "cut out" an object from a scene using a mask
async function _cutoutObjectWithMask(
    sceneImage: File,
    maskImage: File,
): Promise<File> {
    const sceneUrl = await fileToDataUrl(sceneImage);
    const maskUrl = await fileToDataUrl(maskImage);

    return new Promise(async (resolve, reject) => {
        const sceneImg = new Image();
        const maskImg = new Image();

        const sceneLoadPromise = new Promise(r => { sceneImg.onload = r; sceneImg.onerror = reject; sceneImg.src = sceneUrl; });
        const maskLoadPromise = new Promise(r => { maskImg.onload = r; maskImg.onerror = reject; maskImg.src = maskUrl; });
        
        await Promise.all([sceneLoadPromise, maskLoadPromise]);

        const canvas = document.createElement('canvas');
        canvas.width = sceneImg.width;
        canvas.height = sceneImg.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context not available'));

        ctx.drawImage(sceneImg, 0, 0);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(maskImg, 0, 0);

        canvas.toBlob(blob => {
            if (blob) {
                resolve(new File([blob], 'cutout.png', { type: 'image/png' }));
            } else {
                reject(new Error('Failed to create blob from cutout canvas.'));
            }
        }, 'image/png');
    });
}

/**
 * Generates a segmentation mask for an object at a given position.
 * @param environmentImage The original scene image.
 * @param clickPosition The relative coordinates of the user's click.
 * @returns A promise that resolves to the segmentation mask as a File.
 */
export const generateObjectMask = async (
    environmentImage: File,
    clickPosition: { xPercent: number; yPercent: number; }
): Promise<File> => {
    if (geminiError) return Promise.reject(new Error(geminiError));
    
    const { width: originalWidth, height: originalHeight } = await getImageDimensions(environmentImage);
    const MAX_DIMENSION = 1024;
    const resizedEnvironmentImage = await resizeImage(environmentImage, MAX_DIMENSION);
    const markedResizedImage = await markImage(resizedEnvironmentImage, clickPosition, { originalWidth, originalHeight });

    console.log("Generating segmentation mask for object...");
    const maskImageFile = await _generateMaskFromModel(markedResizedImage);
    return maskImageFile;
};

/**
 * Uses a mask to remove an object from a scene via inpainting and returns both
 * the new scene and the cutout object.
 * @param environmentImage The original scene image.
 * @param maskImageFile The segmentation mask of the object to move.
 * @returns A promise that resolves to the inpainted scene URL and the cutout object as a File.
 */
export const applyMoveWithMask = async (
    environmentImage: File,
    maskImageFile: File
): Promise<{ inpaintedSceneUrl: string; objectCutoutFile: File; }> => {
    if (geminiError) return Promise.reject(new Error(geminiError));
    
    const MAX_DIMENSION = 1024;
    const resizedEnvironmentImage = await resizeImage(environmentImage, MAX_DIMENSION);

    console.log("Cutting out object using mask...");
    // The mask is already a 1024x1024 padded square from the previous step
    const objectCutoutFile = await _cutoutObjectWithMask(resizedEnvironmentImage, maskImageFile);

    console.log("Inpainting background to remove object...");
    // Use the original environment image and the generated mask for the highest quality inpaint.
    const { finalImageUrl: inpaintedSceneUrl } = await generateInpaintedScene(environmentImage, maskImageFile);

    return { inpaintedSceneUrl, objectCutoutFile };
};


// --- Style Match Feature ---

export interface StyleMatchResults {
  products: { name: string; description: string; }[];
  paintColors: PaintColor[];
}

export const analyzeInspirationImage = async (
    inspirationImage: File
): Promise<StyleMatchResults> => {
    if (geminiError) return Promise.reject(new Error(geminiError));
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    
    const imagePart = await fileToPart(inspirationImage);
    const prompt = `
You are an expert interior designer with a keen eye for style, color, and furniture.
Analyze the provided image and identify its core design aesthetic (e.g., Mid-Century Modern, Industrial, Coastal, Bohemian).
Based on this analysis, provide a list of 4-6 specific, actionable product suggestions that would fit this style. For each product, provide a name and a concise, descriptive sentence.
Also, extract a color palette of 5-6 complementary colors from the image, giving each color a descriptive name and its hex code.
You must respond in a valid JSON format.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    products: {
                        type: Type.ARRAY,
                        description: 'A list of suggested products that match the image style.',
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: 'The name of the product.' },
                                description: { type: Type.STRING, description: 'A short, descriptive sentence about the product.' }
                            }
                        }
                    },
                    paintColors: {
                        type: Type.ARRAY,
                        description: 'A color palette extracted from the image.',
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: 'A descriptive name for the color (e.g., "Warm Sand", "Deep Teal").' },
                                hex: { type: Type.STRING, description: 'The hex code of the color (e.g., "#D2B48C").' }
                            }
                        }
                    }
                }
            }
        }
    });

    try {
        const jsonText = response.text;
        const parsedJson = JSON.parse(jsonText);
        // Basic validation
        if (parsedJson.products && parsedJson.paintColors) {
            return parsedJson as StyleMatchResults;
        } else {
            throw new Error("Parsed JSON is missing required 'products' or 'paintColors' keys.");
        }
    } catch (e) {
        console.error("Failed to parse JSON response from style analysis:", e);
        throw new Error("The AI failed to return valid style suggestions. Please try a different image.");
    }
};

export const generateProductImage = async (
    prompt: string
): Promise<string> => {
    if (geminiError) return Promise.reject(new Error(geminiError));
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png', // Use PNG for transparency
          aspectRatio: '1:1',
        },
    });

    const generatedImage = response.generatedImages?.[0];
    if (generatedImage?.image?.imageBytes) {
        const base64ImageBytes: string = generatedImage.image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    }

    throw new Error("Failed to generate a product image from the description.");
};


// --- Chat Feature ---

let chat: Chat | null = null;

export const startChat = () => {
        if (geminiError) {
                console.error(geminiError);
                return;
        }
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: 'You are Design Pro, an expert interior designer and carpenter. You can provide design advice, style suggestions, and generate cost estimates for projects. You are helpful and friendly.',
            },
        });
}

export const sendChatMessage = async (message: string): Promise<string> => {
    if (geminiError) return Promise.reject(new Error(geminiError));
    if (!chat) {
        startChat();
    }
    if (!chat) { // check again after trying to start
        return Promise.reject(new Error("Chat could not be initialized."));
    }
    const response = await chat.sendMessage({ message });
    return response.text;
}