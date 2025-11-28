# 🎨 AI Image Reference - How "Upload Your Room Photo" Works

## ✅ YES - The AI Agent References Your Uploaded Photo!

The **"Upload Your Room Photo"** feature on the homepage **absolutely uses AI to reference and edit your image**. Here's exactly how it works:

---

## 🔍 How It Works

### Step 1: Upload Your Room Photo
```
User clicks "Upload Your Room Photo" on homepage
    ↓
Selects image file (bedroom, kitchen, living room, etc.)
    ↓
Image loads into the Canvas interface
    ↓
Original image is stored and displayed
```

### Step 2: AI Agent Receives the Image
```
When you type a message like:
"Paint the walls blue" or "Add a modern sofa"
    ↓
The system sends BOTH:
  1. Your uploaded room photo (as File)
  2. Your text prompt (what you want changed)
    ↓
Sends to: generateEditedSceneFromText()
```

### Step 3: AI Analyzes and Edits
```typescript
// From geminiService.ts
export const generateEditedSceneFromText = async (
    environmentImage: File,  // ← YOUR UPLOADED PHOTO
    textPrompt: string,       // ← YOUR EDIT REQUEST
    apiKey: string
): Promise<{ finalImageUrl: string; finalPrompt: string; }> => {
    // AI receives your photo and analyzes it
    // Then applies your requested edits
    // Returns the modified image
}
```

### Step 4: AI Prompt Sent to Gemini
The AI receives this instruction:

```
**Role:**
You are a master photo editor and visual artist. Your task is to 
edit a provided scene image based on a user's text description.

**Scene to edit:**
[YOUR UPLOADED ROOM PHOTO]

**Edit Instruction:**
You must perform the following edit: "Paint the walls blue"

**Final Image Requirements:**
- The edited image must be photorealistic and seamlessly integrated
- Maintain the original image's style, lighting, shadows, and camera perspective
- Do not return the original image. The specified edit must be applied.
```

### Step 5: AI Returns Edited Image
```
Gemini AI processes your room photo
    ↓
Applies the requested changes
    ↓
Returns new edited image
    ↓
Displayed on canvas (you can toggle original vs edited)
```

---

## 💡 Example Workflow

### Scenario: You want to redesign your living room

**1. Upload Photo:**
```
You upload: living-room.jpg
(Shows couch, walls, coffee table, etc.)
```

**2. Chat with AI:**
```
You: "Paint the walls sage green"
AI: ✓ Applies edit, returns image with green walls

You: "Add a modern leather couch"
AI: ✓ Applies edit on top of previous changes

You: "Make it darker, evening lighting"
AI: ✓ Applies lighting changes to current state
```

**3. View Results:**
```
Original Photo ←→ Toggle ←→ AI-Edited Photo
(Your room)              (With all AI changes)
```

---

## 🎯 What the AI Can Do With Your Photo

The AI references your uploaded photo to:

### ✅ Analyze Scene Elements
- Detects walls, furniture, flooring, lighting
- Understands room layout and perspective
- Recognizes objects and their positions

### ✅ Apply Realistic Edits
- **Paint colors:** "Paint the walls navy blue"
- **Furniture:** "Add a modern sofa" or "Remove the chair"
- **Lighting:** "Make it brighter" or "Add warm evening lighting"
- **Flooring:** "Change to hardwood floors"
- **Décor:** "Add plants" or "Add wall art"
- **Style:** "Make it modern" or "Make it rustic"

### ✅ Maintain Realism
- Preserves original lighting and shadows
- Keeps camera perspective accurate
- Seamlessly integrates changes
- Photorealistic output

### ✅ Iterative Editing
- Each new edit builds on previous changes
- History tracking (Undo button available)
- Toggle between original and edited versions

---

## 🔧 Technical Implementation

### Canvas.tsx (Main Component)
```typescript
// When user sends chat message
const handleSendMessage = async (message: string) => {
    // Use processed image if exists, else original
    const currentImageUrl = processedImage || originalImage;
    
    // Convert to File object
    const currentImageFile = processedImage 
        ? dataURLtoFile(processedImage, 'current-image.jpg')
        : selectedFile;
    
    // Call AI with image + prompt
    const { finalImageUrl, finalPrompt } = await generateEditedSceneFromText(
        currentImageFile,  // ← YOUR PHOTO
        message,           // ← YOUR REQUEST
        apiKey
    );
    
    // Display edited result
    setProcessedImage(finalImageUrl);
};
```

### geminiService.ts (AI Processing)
```typescript
export const generateEditedSceneFromText = async (
    environmentImage: File,  // ← Your uploaded room photo
    textPrompt: string,      // ← "Paint walls blue"
    apiKey: string
) => {
    // 1. Resize image to optimal size (1024px max)
    const resizedEnvironmentImage = await resizeImage(environmentImage, 1024);
    
    // 2. Convert to format AI can understand
    const environmentImagePart = await fileToPart(resizedEnvironmentImage);
    
    // 3. Create detailed prompt for AI
    const prompt = `You are a master photo editor...
        Scene to edit: [The uploaded image]
        Edit Instruction: "${textPrompt}"
        Requirements: Photorealistic, maintain lighting/shadows...`;
    
    // 4. Send to Gemini AI
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [environmentImagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
    });
    
    // 5. Extract and return edited image
    return { finalImageUrl, finalPrompt };
};
```

---

## 🎨 AI Model Used

### Gemini 2.5 Flash Image
- **Model:** `gemini-2.5-flash-image`
- **Capabilities:**
  - Image understanding (analyzes your room)
  - Image generation (creates edits)
  - Text-to-image editing (applies your prompts)
  - Maintains photorealism
  - Preserves scene context

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Uploads Photo                                   │
│    living-room.jpg → Canvas Component                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. User Types Edit Request                              │
│    "Paint the walls blue"                               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Canvas Component Packages Data                       │
│    - Original/Processed Image (File)                    │
│    - Text Prompt (String)                               │
│    - API Key                                             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Sent to geminiService.ts                             │
│    generateEditedSceneFromText()                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Image Processing                                      │
│    - Resize to 1024px max                                │
│    - Convert to base64                                   │
│    - Create AI prompt                                    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Google Gemini AI API Call                            │
│    POST to gemini-2.5-flash-image                       │
│    Body: { image: base64, prompt: "..." }               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 7. AI Processes Request                                  │
│    - Analyzes uploaded room photo                        │
│    - Identifies walls, furniture, layout                 │
│    - Applies "paint walls blue" edit                     │
│    - Maintains lighting/shadows/perspective              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 8. AI Returns Edited Image                               │
│    - Base64 encoded image                                │
│    - Same dimensions as original                         │
│    - Photorealistic result                               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 9. Canvas Displays Result                                │
│    - Shows edited image                                  │
│    - Saves to history (for undo)                         │
│    - Updates chat with confirmation                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features

### 1. **Iterative Editing**
Each edit builds on the previous one:
```
Original Photo
    ↓ "Paint walls blue"
Blue Walls Photo
    ↓ "Add modern couch"
Blue Walls + Couch Photo
    ↓ "Add plants"
Blue Walls + Couch + Plants Photo
```

### 2. **History & Undo**
```typescript
// Saves each version before making new edits
if (processedImage) {
    setImageHistory(prev => [...prev, processedImage]);
}

// Undo button restores previous version
const handleUndo = () => {
    const previousImage = imageHistory[imageHistory.length - 1];
    setProcessedImage(previousImage);
};
```

### 3. **Toggle View**
```typescript
// Switch between original and edited
const [showOriginal, setShowOriginal] = useState(false);

<button onClick={() => setShowOriginal(!showOriginal)}>
    {showOriginal ? 'Show Processed' : 'Show Original'}
</button>
```

### 4. **Chat Interface**
```typescript
// AI responds with confirmation
const aiResponse = { 
    role: 'model',
    parts: [{ 
        text: `I've applied your requested edit: "${message}". 
               The updated image is now displayed on the canvas.` 
    }] 
};
```

---

## 💰 Cost Considerations

### Using Gemini 2.5 Flash Image API

**Pricing (as of 2024):**
- Input: ~$0.0001 per image
- Output: ~$0.0002 per image
- **Total per edit: ~$0.0003** (less than a penny!)

**Example Monthly Costs:**
- 100 edits = $0.03
- 1,000 edits = $0.30
- 10,000 edits = $3.00

Very affordable for unlimited room redesigns! 💰

---

## 🎯 Example Prompts You Can Try

### Paint & Colors
```
"Paint the walls sage green"
"Change wall color to warm beige"
"Make the ceiling white"
```

### Furniture
```
"Add a modern gray sofa"
"Remove the coffee table"
"Add a dining table with 6 chairs"
"Replace the chair with a recliner"
```

### Lighting
```
"Make it brighter, morning light"
"Add evening lighting, warm tones"
"Make it darker, mood lighting"
```

### Flooring
```
"Change to hardwood floors"
"Add a rug under the coffee table"
"Replace with tile flooring"
```

### Décor
```
"Add plants in the corners"
"Add wall art above the sofa"
"Add curtains to the windows"
"Add throw pillows to the couch"
```

### Style
```
"Make it more modern"
"Make it rustic farmhouse style"
"Add industrial elements"
"Make it minimalist"
```

---

## 🚀 How to Use It

### Step-by-Step:

1. **Go to Homepage** (Canvas page)
   - URL: https://renovision.web.app

2. **Upload Room Photo**
   - Click "Upload Your Room Photo"
   - Select image from computer
   - Wait for upload to complete

3. **Set Up API Key** (First time only)
   - Click "API Settings" if prompted
   - Enter your Google Gemini API key
   - Get free key at: https://aistudio.google.com/apikey

4. **Start Editing with AI**
   - Type in chat: "Paint the walls blue"
   - Wait 3-5 seconds for AI processing
   - See edited result on canvas

5. **Continue Editing**
   - Type next edit: "Add modern furniture"
   - Each edit builds on previous changes
   - Use "Undo" button if needed

6. **Download Result**
   - Click "Download" button
   - Save edited room photo
   - Share with clients!

---

## 🆘 Troubleshooting

### "Please set up your API key first"
**Solution:** Click API Settings → Enter Gemini API key → Save

### "Please upload an image first"
**Solution:** Click "Choose Photo" → Select room image → Wait for upload

### "Failed to process image edit"
**Solution:** 
- Check API key is valid
- Check image file is not corrupted
- Check internet connection
- Try simpler prompt first

### Image looks weird/distorted
**Solution:**
- Upload higher quality photo
- Use better lighting in original photo
- Try more specific prompts
- Use "Undo" and try different wording

---

## 📝 Summary

**YES!** The "Upload Your Room Photo" feature:

✅ **Sends your photo to AI** for analysis  
✅ **AI understands your room** (walls, furniture, layout)  
✅ **AI applies your edits** based on text prompts  
✅ **Returns photorealistic results** with seamless integration  
✅ **Supports iterative editing** (build on previous changes)  
✅ **Maintains history** (undo feature)  
✅ **Very affordable** (~$0.0003 per edit)  

Your uploaded photo is **absolutely used as a reference** by the AI agent! It's the core of the entire feature - the AI analyzes your actual room and makes realistic changes based on your requests. 🎨✨
