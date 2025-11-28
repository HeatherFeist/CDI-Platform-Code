/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

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
 * to generate a new image with the product placed in the scene.
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
    dropPosition: { xPercent: number; yPercent: number; },
    apiKey: string
): Promise<{ finalImageUrl: string; debugImageUrl: string; finalPrompt: string; }> => {
  if (!apiKey) return Promise.reject(new Error("API key is required"));
  console.log('Starting multi-step image generation process...');
  const ai = new GoogleGenAI({ apiKey });

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
You are a visual composition expert. Your task is to take a 'product' image and seamlessly integrate it into a 'scene' image, adjusting for perspective, lighting, and scale.

**Specifications:**
-   **Product to add:**
    The first image provided. It may be surrounded by black padding or background, which you should ignore and treat as transparent and only keep the product.
-   **Scene to use:**
    The second image provided. It may also be surrounded by black padding, which you should ignore.
-   **Placement Instruction (Crucial):**
    -   You must place the product at the location described below exactly. You should only place the product once. Use this dense, semantic description to find the exact spot in the scene.
    -   **Product location Description:** "${semanticLocationDescription}"
-   **Final Image Requirements:**
    -   The output image's style, lighting, shadows, reflections, and camera perspective must exactly match the original scene.
    -   Do not just copy and paste the product. You must intelligently re-render it to fit the context. Adjust the product's perspective and orientation to its most natural position, scale it appropriately, and ensure it casts realistic shadows according to the scene's light sources.
    -   The product must have proportional realism. For example, a lamp product can't be bigger than a sofa in scene.
    -   You must not return the original scene image without product placement. The product must be always present in the composite image.

The output should ONLY be the final, composed image. Do not add any text or explanation.
`;

  const textPart = { text: prompt };
  
  console.log('Sending images and augmented prompt...');
  
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [objectImagePart, cleanEnvironmentImagePart, textPart] },
    config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
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
    dropPosition: { xPercent: number; yPercent: number; },
    apiKey: string
): Promise<{ finalImageUrl: string; debugImageUrl: string; finalPrompt: string; }> => {
  if (!apiKey) return Promise.reject(new Error("API key is required"));
  console.log('Starting multi-step image paint process...');
  const ai = new GoogleGenAI({ apiKey });

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
    -   The repainted area must retain its original material texture, lighting, shadows, and highlights.
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
        responseModalities: [Modality.IMAGE, Modality.TEXT],
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
    dropPosition: { xPercent: number; yPercent: number; },
    apiKey: string
): Promise<{ finalImageUrl: string; debugImageUrl: string; finalPrompt: string; }> => {
  if (!apiKey) return Promise.reject(new Error("API key is required"));
  console.log('Starting multi-step object removal process...');
  const ai = new GoogleGenAI({ apiKey });

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
    -   The area where the object was removed must be seamlessly filled in, matching the surrounding textures, lighting, shadows, and perspective of the original scene.
    -   The result must be completely photorealistic, as if the object was never there.
    -   Do not leave any artifacts, blurs, or empty spaces.
    -   Do not return the original image. The specified object must be removed.

The output should ONLY be the final, edited image. Do not add any text or explanation.
`;

  const textPart = { text: prompt };
  
  console.log('Sending images and augmented prompt for removal...');
  
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [cleanEnvironmentImagePart, textPart] },
    config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
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

export const generateAIResponse = async (
    prompt: string,
    apiKey: string
): Promise<string> => {
    if (!apiKey) throw new Error("API key is required");
    
    const ai = new GoogleGenAI({ apiKey });
    const model = ai.models.generateContent({
        model: 'gemini-pro',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const result = await model;
    if (!result || result instanceof Error) {
        throw new Error("Failed to get response from Gemini API");
    }

    return result.text;
};

/**
 * Generate a detailed estimate from natural language project description
 * Uses zip code-based unit cost method for accurate regional pricing
 */
export interface EstimateLineItem {
    name: string;
    description: string;
    taskCategory: string;
    quantity: number;
    unitType: string;
    unitCost: number;
    laborCost: number;
    materialCost: number;
    equipmentCost: number;
    totalCost: number;
    notes?: string;
}

export interface GeneratedEstimate {
    projectName: string;
    projectDescription: string;
    scope: string;
    lineItems: EstimateLineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    estimatedDuration: number; // in days
    notes: string;
    measurements: {
        area?: number;
        length?: number;
        height?: number;
        volume?: number;
        rooms?: number;
    };
}

export const generateEstimateFromNaturalLanguage = async (
    naturalLanguageInput: string,
    zipCode: string,
    apiKey: string
): Promise<GeneratedEstimate> => {
    if (!apiKey) throw new Error("API key is required");
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Import Homewyse pricing methodology
    const { getHomewyseInspiredPrompt } = await import('./homewyseService');
    const homewyseGuidelines = getHomewyseInspiredPrompt(zipCode);
    
    const prompt = `
You are a Master Craftsman and Skilled Contractor with over 25 years of hands-on experience in the construction and trades industry. You have worked on thousands of residential and commercial projects, from small repairs to full-scale renovations and new construction. Your expertise spans ALL trades including:

• **Carpentry & Framing** - Rough carpentry, finish carpentry, custom woodwork, deck building
• **Painting & Finishing** - Interior/exterior painting, drywall, texturing, staining, refinishing
• **Flooring** - Hardwood, tile, laminate, vinyl, carpet installation and repair
• **Plumbing** - Rough-in, fixtures, water heaters, drainage systems, pipe repair
• **Electrical** - Wiring, lighting, panels, outlets, switches, code compliance
• **HVAC** - Heating, cooling, ductwork, ventilation systems
• **Roofing & Siding** - Shingles, metal roofing, gutters, exterior cladding
• **Masonry & Concrete** - Foundations, retaining walls, patios, driveways, brick/stone work
• **Cabinetry & Countertops** - Kitchen/bath cabinets, custom built-ins, stone/quartz/granite counters
• **Tile Work** - Ceramic, porcelain, natural stone installation for floors, walls, showers
• **Windows & Doors** - Installation, replacement, weatherization, trim work
• **Demolition & Site Work** - Safe demolition, debris removal, excavation
• **Design & Space Planning** - Functional layouts, aesthetic recommendations, material selection

You have an exceptional eye for detail and design, understanding both the technical construction requirements and the aesthetic appeal that homeowners desire. You can accurately assess project scope from photos and descriptions, anticipate potential issues, and provide comprehensive estimates that account for all labor, materials, equipment, permits, and contingencies.

Your estimating approach follows industry-standard unit cost methodology and Homewyse.com pricing standards, adjusted for regional variations and current 2025 market conditions.

**Your Task:**
Analyze the provided project description (and photos if included) and generate a highly detailed, professional construction estimate with comprehensive line items, accurate quantities, and realistic costs using Homewyse-style pricing methodology.

**Project Description:**
${naturalLanguageInput}

**Location Context:**
ZIP Code: ${zipCode}

${homewyseGuidelines}

**Critical Requirements:**

1. **Extract Project Information:**
   - Project name (create a professional name if not provided)
   - Detailed project description
   - Scope of work
   - All measurements mentioned (square feet, linear feet, rooms, dimensions, etc.)

2. **Break Down into Line Items:**
   For each task/item in the project, create a detailed line item with:
   - Task name (e.g., "Install Hardwood Flooring", "Paint Interior Walls")
   - Task category (Flooring, Painting, Roofing, Plumbing, Electrical, Drywall, Cabinets, Countertops, Demolition, Framing, HVAC, Insulation, Landscaping, Masonry, Siding, Tile, Windows, Doors, etc.)
   - Description (detailed scope for this specific item)
   - Quantity (numeric value extracted from measurements)
   - Unit type (square_foot, linear_foot, cubic_yard, each, hour, day, fixed)
   - Unit cost ($ per unit - use Homewyse-style pricing for ${zipCode} area)
   - Labor cost (separated, using local labor rates)
   - Material cost (separated, with 10-15% waste factor)
   - Equipment cost if applicable (separated)
   - Total cost for this line item

3. **Use Homewyse Pricing Standards:**
   - Apply accurate regional multipliers based on ZIP code ${zipCode}
   - Separate labor from materials like Homewyse does
   - Include job preparation costs (5-10% of materials)
   - Add contractor overhead and profit (15-25%)
   - Use current 2025 market rates

4. **Calculate Totals:**
   - Sum all line items for subtotal
   - Apply realistic tax rate for the region (typically 6-10%)
   - Calculate final total

5. **Estimate Project Duration:**
   - Provide realistic timeline in days based on scope
   - Consider typical crew sizes and work hours

6. **Add Professional Notes:**
   - Important assumptions made
   - Items not included
   - Recommendations
   - Permit requirements if applicable

**Output Format (JSON):**
Return ONLY valid JSON with this exact structure (no markdown, no explanations):

{
  "projectName": "Professional project name",
  "projectDescription": "Detailed description",
  "scope": "Complete scope of work",
  "lineItems": [
    {
      "name": "Task name",
      "description": "Detailed task description",
      "taskCategory": "Category name",
      "quantity": 500,
      "unitType": "square_foot",
      "unitCost": 12.50,
      "laborCost": 2500.00,
      "materialCost": 3750.00,
      "equipmentCost": 0.00,
      "totalCost": 6250.00,
      "notes": "Additional notes if any"
    }
  ],
  "subtotal": 25000.00,
  "taxRate": 0.08,
  "taxAmount": 2000.00,
  "total": 27000.00,
  "estimatedDuration": 14,
  "notes": "Professional notes, assumptions, and recommendations",
  "measurements": {
    "area": 500,
    "length": 50,
    "height": 10,
    "rooms": 3
  }
}

**Important:**
- Be thorough - include all labor, materials, equipment, prep work, cleanup
- Use realistic market rates for ${zipCode} area
- Separate labor and materials costs
- Include common items people forget (permits, disposal, prep, cleanup)
- If measurements are vague, make reasonable professional assumptions and note them
- Return ONLY the JSON object, nothing else
`;

    console.log('Generating estimate from natural language...');
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        const result = response.text.trim();
        console.log('AI Response:', result);
        
        // Remove markdown code blocks if present
        let cleanedResult = result;
        if (cleanedResult.startsWith('```json')) {
            cleanedResult = cleanedResult.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (cleanedResult.startsWith('```')) {
            cleanedResult = cleanedResult.replace(/```\n?/g, '');
        }
        
        try {
            const estimate: GeneratedEstimate = JSON.parse(cleanedResult);
            return estimate;
        } catch (error) {
            console.error('Failed to parse AI response as JSON:', error);
            console.error('Raw response:', result);
            throw new Error('Failed to parse estimate from AI response. The AI returned invalid JSON. Please try again.');
        }
    } catch (error) {
        console.error('API call failed:', error);
        if (error instanceof Error) {
            throw new Error(`AI API Error: ${error.message}. Please check your API key and network connection.`);
        }
        throw new Error('Failed to communicate with AI service. Please try again.');
    }
};

export const generateInpaintedScene = async (
    environmentImage: File,
    maskImage: File,
    apiKey: string
): Promise<{ finalImageUrl: string; finalPrompt: string; }> => {
    if (!apiKey) return Promise.reject(new Error("API key is required"));
    console.log('Starting inpainting process...');
    const ai = new GoogleGenAI({ apiKey });

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
    -   Fill the removed area by seamlessly extending the surrounding background textures, lighting, shadows, and perspective.
    -   The final result must be completely photorealistic, as if the masked objects were never there.
    -   Do not leave any artifacts, blurs, or empty spaces.
    -   Do not alter any area of the image outside the masked region.

The output should ONLY be the final, edited image. Do not add any text or explanation.
`;

    const textPart = { text: prompt };
    
    console.log('Sending images and prompt for inpainting...');
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [environmentImagePart, maskImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
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
    textPrompt: string,
    apiKey: string
): Promise<{ finalImageUrl: string; finalPrompt: string; }> => {
    if (!apiKey) return Promise.reject(new Error("API key is required"));
    console.log('Starting text-based edit...');
    const ai = new GoogleGenAI({ apiKey });

    const { width: originalWidth, height: originalHeight } = await getImageDimensions(environmentImage);
    const MAX_DIMENSION = 1024;
    
    console.log('Resizing scene image...');
    const resizedEnvironmentImage = await resizeImage(environmentImage, MAX_DIMENSION);
    
    const environmentImagePart = await fileToPart(resizedEnvironmentImage);
    
    const prompt = `
**Role:**
You are a Master Craftsman with over 25 years of experience in construction, renovation, and interior design. You combine deep technical expertise in all building trades with an exceptional eye for aesthetics and space planning. You understand materials, construction methods, lighting, color theory, and design principles at an expert level.

Your task is to edit a provided room/space image based on the user's renovation or design request. Your edits must be both technically feasible (considering real construction practices) and visually stunning (considering design principles).

**Specifications:**
-   **Scene to edit:**
    The image provided shows a room or space that needs renovation/redesign work.
-   **Edit Instruction (Crucial):**
    -   You must perform the following renovation/design edit: "${textPrompt}".
    -   Apply your 25+ years of construction and design expertise to make this edit realistic and professional.
    -   Consider proper construction techniques, material choices, and design aesthetics.
-   **Final Image Requirements:**
    -   The edited image must be photorealistic and construction-accurate.
    -   Maintain proper perspective, scale, and proportions.
    -   Ensure lighting, shadows, and reflections are physically correct.
    -   Use materials and finishes that are actually available and commonly used.
    -   The result should look like a professional "after" photo from a high-end renovation project.
    -   Do not return the original image. The specified renovation/design edit must be expertly applied.

The output should ONLY be the final, professionally edited image showing the completed renovation. Do not add any text or explanation.
`;

    const textPart = { text: prompt };
    
    console.log('Sending image and text prompt for editing...');
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [environmentImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
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


// --- Move Object Feature ---

// Internal helper to get a segmentation mask from the model
async function _generateMaskFromModel(
    markedSceneImage: File,
    apiKey: string
): Promise<File> {
    const ai = new GoogleGenAI({ apiKey });
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
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
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
    clickPosition: { xPercent: number; yPercent: number; },
    apiKey: string
): Promise<File> => {
    if (!apiKey) return Promise.reject(new Error("API key is required"));
    
    const { width: originalWidth, height: originalHeight } = await getImageDimensions(environmentImage);
    const MAX_DIMENSION = 1024;
    const resizedEnvironmentImage = await resizeImage(environmentImage, MAX_DIMENSION);
    const markedResizedImage = await markImage(resizedEnvironmentImage, clickPosition, { originalWidth, originalHeight });

    console.log("Generating segmentation mask for object...");
    const maskImageFile = await _generateMaskFromModel(markedResizedImage, apiKey);
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
    maskImageFile: File,
    apiKey: string
): Promise<{ inpaintedSceneUrl: string; objectCutoutFile: File; }> => {
    if (!apiKey) return Promise.reject(new Error("API key is required"));
    
    const MAX_DIMENSION = 1024;
    const resizedEnvironmentImage = await resizeImage(environmentImage, MAX_DIMENSION);

    console.log("Cutting out object using mask...");
    // The mask is already a 1024x1024 padded square from the previous step
    const objectCutoutFile = await _cutoutObjectWithMask(resizedEnvironmentImage, maskImageFile);

    console.log("Inpainting background to remove object...");
    // Use the original environment image and the generated mask for the highest quality inpaint.
    const { finalImageUrl: inpaintedSceneUrl } = await generateInpaintedScene(environmentImage, maskImageFile, apiKey);

    return { inpaintedSceneUrl, objectCutoutFile };
};

/**
 * Generate estimate from natural language description AND project images
 * The AI will analyze the images to better understand scope, condition, and complexity
 */
export const generateEstimateFromImagesAndText = async (
    naturalLanguageInput: string,
    zipCode: string,
    projectImages: File[],
    apiKey: string
): Promise<GeneratedEstimate> => {
    if (!apiKey) throw new Error("API key is required");
    if (projectImages.length === 0) {
        // Fallback to text-only if no images
        return generateEstimateFromNaturalLanguage(naturalLanguageInput, zipCode, apiKey);
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Import Homewyse pricing methodology
    const { getHomewyseInspiredPrompt } = await import('./homewyseService');
    const homewyseGuidelines = getHomewyseInspiredPrompt(zipCode);
    
    // Convert images to parts for Gemini
    const imageParts = await Promise.all(
        projectImages.map(async (image) => await fileToPart(image))
    );
    
    const prompt = `
You are a Master Craftsman and Skilled Contractor with over 25 years of hands-on experience in the construction and trades industry. You have personally completed thousands of projects and have deep expertise in ALL construction trades:

**Your Trade Expertise:**
• **Carpentry & Framing** - Structural framing, finish carpentry, custom millwork, deck construction
• **Painting & Finishing** - Interior/exterior painting, drywall installation/repair, texture work, cabinet refinishing
• **Flooring** - Hardwood, tile, laminate, vinyl, carpet - installation, repair, refinishing
• **Plumbing** - Complete rough-in, fixture installation, water heaters, drainage, pipe systems
• **Electrical** - Full wiring, service panels, lighting design, code-compliant installations
• **HVAC** - Heating/cooling systems, ductwork, ventilation, energy efficiency
• **Roofing & Exterior** - All roofing types, gutters, siding, weatherproofing
• **Masonry & Concrete** - Foundations, flatwork, retaining walls, brick/stone veneer
• **Cabinetry** - Kitchen/bath cabinets, custom built-ins, countertop installation
• **Tile Work** - Ceramic, porcelain, natural stone for floors, walls, backsplashes, showers
• **Windows & Doors** - Installation, replacement, weatherization, trim carpentry
• **Demolition & Site Prep** - Safe demo practices, debris removal, site preparation
• **Design & Planning** - Space optimization, material selection, aesthetic coordination

**Your Unique Abilities:**
✓ Accurately assess project scope from photos - you can "see" what needs to be done
✓ Spot potential issues that less experienced estimators miss (rot, structural concerns, code violations)
✓ Understand the relationship between trades and proper sequencing
✓ Recommend the right materials and methods for each unique situation
✓ Provide realistic timelines based on actual field experience
✓ Anticipate complications and include appropriate contingencies
✓ Balance quality craftsmanship with cost-effectiveness

**Your Estimating Approach:**
You create highly detailed, professional estimates using industry-standard unit cost methodology and Homewyse.com pricing standards, calibrated to current 2025 market conditions and regional variations. Your estimates are thorough, accurate, and respected by homeowners and contractors alike.

**Your Task:**
Carefully analyze the provided project images AND text description. Use your 25+ years of experience to assess the current condition, identify all work required, spot potential complications, and generate a comprehensive, professional construction estimate with detailed line items, accurate quantities, and realistic pricing.

**Project Description:**
${naturalLanguageInput}

**Location Context:**
ZIP Code: ${zipCode}

**Image Analysis Instructions:**
The user has provided ${projectImages.length} project image(s). Carefully analyze each image to:
1. **Assess Current Condition**: Identify existing materials, damage, wear, or issues
2. **Estimate Dimensions**: Gauge room sizes, ceiling heights, and areas from visual cues
3. **Identify Scope**: Determine what needs to be repaired, replaced, or installed
4. **Material Quality**: Observe current material grades and recommend appropriate replacements
5. **Hidden Issues**: Note potential complications (water damage, structural issues, etc.)
6. **Complexity Factors**: Assess difficulty level based on access, existing conditions, and special requirements

${homewyseGuidelines}

**Critical Requirements:**

1. **Extract Project Information from BOTH Images and Text:**
   - Project name (create a professional name if not provided)
   - Detailed project description incorporating visual observations
   - Comprehensive scope of work based on images and description
   - All measurements (from text or estimated from images)
   - Current condition assessment from images
   - Complexity factors observed in images

2. **Break Down into Line Items:**
   For each task/item in the project, create a detailed line item with:
   - Task name (e.g., "Remove and Replace Damaged Drywall", "Install Hardwood Flooring")
   - Task category (Flooring, Painting, Roofing, Plumbing, Electrical, Drywall, Demolition, etc.)
   - Description (detailed scope including observations from images)
   - Quantity (numeric value from text or estimated from images)
   - Unit type (square_foot, linear_foot, cubic_yard, each, hour, day, fixed)
   - Unit cost ($ per unit - use Homewyse-style pricing for ${zipCode} area)
   - Labor cost (separated, adjusted for complexity seen in images)
   - Material cost (separated, with 10-15% waste factor)
   - Equipment cost if applicable
   - Total cost for this line item

3. **Adjust for Image-Based Observations:**
   - If images show extensive damage, increase labor hours by 10-20%
   - If images reveal difficult access or tight spaces, add complexity premium (5-15%)
   - If current materials need special disposal, include disposal costs
   - If images show quality finishes, recommend appropriate replacement quality

4. **Use Homewyse Pricing Standards:**
   - Apply accurate regional multipliers for ZIP ${zipCode}
   - Separate labor from materials
   - Include job preparation costs (5-10%)
   - Add contractor overhead and profit (15-25%)
   - Use current 2025 market rates

5. **Calculate Totals:**
   - Sum all line items for subtotal
   - Apply realistic tax rate for the region
   - Calculate final total

6. **Estimate Project Duration:**
   - Provide realistic timeline in days based on scope AND image complexity
   - Consider typical crew sizes and work hours

7. **Add Professional Notes:**
   - Important observations from the images
   - Assumptions made based on visual inspection
   - Items not visible in images that may need attention
   - Recommended inspections or permits
   - Potential additional costs if hidden issues are discovered

**Output Format (JSON):**
Return ONLY valid JSON with this exact structure (no markdown, no explanations):

{
  "projectName": "Professional project name based on images and description",
  "projectDescription": "Detailed description incorporating visual observations",
  "scope": "Complete scope of work based on images and text",
  "lineItems": [
    {
      "name": "Task name",
      "description": "Detailed task description with image observations",
      "taskCategory": "Category name",
      "quantity": 500,
      "unitType": "square_foot",
      "unitCost": 12.50,
      "laborCost": 2500.00,
      "materialCost": 3750.00,
      "equipmentCost": 0.00,
      "totalCost": 6250.00,
      "notes": "Based on condition observed in images"
    }
  ],
  "subtotal": 25000.00,
  "taxRate": 0.08,
  "taxAmount": 2000.00,
  "total": 27000.00,
  "measurements": {
    "squareFeet": 800,
    "rooms": 1,
    "notes": "Estimated from images and description"
  },
  "estimatedDuration": 14,
  "notes": [
    "Observations from project images",
    "Current condition indicates [specific observations]",
    "Recommend professional inspection for [specific concerns]",
    "Timeline: 2-3 weeks including prep, demo, installation, and finishing",
    "Assumptions made",
    "Items not included"
  ],
  "assumptions": [
    "Based on ${projectImages.length} project image(s) provided",
    "Other relevant assumptions"
  ]
}
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { 
                    role: 'user', 
                    parts: [
                        { text: prompt },
                        ...imageParts
                    ] 
                }
            ]
        });

        const result = response.text.trim();
        console.log('AI Response with Images:', result);
        
        // Remove markdown code blocks if present
        let cleanedResult = result;
        if (cleanedResult.startsWith('```json')) {
            cleanedResult = cleanedResult.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (cleanedResult.startsWith('```')) {
            cleanedResult = cleanedResult.replace(/```\n?/g, '');
        }
        
        try {
            const estimate: GeneratedEstimate = JSON.parse(cleanedResult);
            return estimate;
        } catch (error) {
            console.error('Failed to parse AI response as JSON:', error);
            console.error('Raw response:', result);
            throw new Error('Failed to parse estimate from AI response. The AI returned invalid JSON. Please try again.');
        }
    } catch (error) {
        console.error('API call with images failed:', error);
        if (error instanceof Error) {
            throw new Error(`AI API Error: ${error.message}. Please check your API key and network connection.`);
        }
        throw new Error('Failed to communicate with AI service. Please try again.');
    }
};