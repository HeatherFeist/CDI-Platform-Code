# Quick Start: AI Image Enhancement

## Setup (One-Time)

### 1. Get Your Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)

### 2. Add to Environment
Open `.env` file (create if doesn't exist) and add:
```bash
VITE_GEMINI_API_KEY=AIza...your-key-here
```

### 3. Restart Dev Server
```bash
npm run dev
```

---

## Usage: Enhance Your Product Photos

### Step 1: Navigate to Create Listing
- Go to http://localhost:3000
- Click "Sell" or "Create Listing"

### Step 2: Find Image Enhancement Section
- Scroll down to "AI Photo Enhancement"
- You'll see a purple-bordered upload area

### Step 3: Upload Your Photo
- Click the upload area or drag-and-drop
- Select a product photo from your computer
- Wait 2-3 seconds for AI analysis

### Step 4: Review Quality Analysis
You'll immediately see:
- **Quality Score** (0-100) with color coding
  - 🟢 Green (80+): Excellent
  - 🟡 Yellow (60-79): Good
  - 🔴 Red (0-59): Needs work
  
- **Photo Grade** (A-F badge)
  - A: Professional quality
  - B: Good quality
  - C: Average
  - D: Below average
  - F: Poor quality

- **Strengths** - What's good about your photo
- **Weaknesses** - What needs improvement
- **Quick Fixes** - Step-by-step suggestions
- **Issues** - Specific problems detected

### Step 5: Auto-Enhance (Optional)
- Click **"Auto-Enhance Photo"** button
- Wait 1-2 seconds for processing
- See before/after comparison side-by-side
- Enhanced image automatically added to your listing

### Step 6: Review Improvements
An alert will show:
```
✨ Image Enhanced!

Improvements:
• Increased brightness by 15%
• Enhanced contrast
• Applied sharpening
• Reduced noise

Score: 65 → 85
```

---

## Understanding the Scores

### Quality Score (0-100)
- **90-100:** Professional photographer quality
- **80-89:** Excellent, ready to use
- **70-79:** Good, minor tweaks recommended
- **60-69:** Acceptable, enhancement recommended
- **50-59:** Below average, should enhance
- **0-49:** Poor quality, re-shoot recommended

### Grading System
- **A:** No improvements needed, perfect listing photo
- **B:** Minor improvements could help, but already good
- **C:** Average quality, enhancement will help significantly
- **D:** Below standard, enhancement essential
- **F:** Unusable without major improvements

---

## Common Issues & Solutions

### Issue: "Image enhancement requires a Gemini API key"
**Solution:** You haven't added the API key yet
1. Get key from https://makersuite.google.com/app/apikey
2. Add to `.env` file
3. Restart dev server (`npm run dev`)

### Issue: "Failed to analyze image"
**Solutions:**
- Check internet connection
- Verify API key is correct (no extra spaces)
- Ensure image is under 5MB
- Try different image format (JPG works best)
- Check browser console for detailed error

### Issue: Score is low even though photo looks good
**Explanation:** AI checks technical quality:
- Lighting (is it properly lit?)
- Focus (is it sharp?)
- Framing (is item centered?)
- Background (is it clean/professional?)

Even if photo "looks fine," these technical factors affect buyer perception.

### Issue: Enhancement doesn't show much improvement
**Explanation:** If original photo scores 80+, there's little to improve!
- Auto-enhance works best on 50-70 score range
- Professional photos may not need enhancement
- Try uploading a different, lower-quality photo to see dramatic improvements

---

## Tips for Best Results

### Before Enhancement
1. **Good Lighting** - Natural light or bright room
2. **Clean Background** - Plain wall or surface
3. **Centered Item** - Fill most of the frame
4. **Sharp Focus** - Hold camera steady
5. **Multiple Angles** - Front, back, sides, details

### What AI Fixes
✅ **Brightness** - Too dark or too bright
✅ **Contrast** - Flat/dull colors
✅ **Sharpness** - Slightly blurry photos
✅ **Color Balance** - Unnatural tones

### What AI Cannot Fix
❌ **Severe blur** - Re-shoot with steady hand
❌ **Wrong angle** - Need different perspective
❌ **Background removal** - Detected but not removed (yet)
❌ **Object replacement** - Can't change what's in photo

---

## Example Workflow

### Scenario: Selling a vintage watch

1. **First Photo Upload**
   - Upload watch on cluttered desk
   - Score: 45/100 (F grade)
   - Issues: "Cluttered background, poor lighting, not centered"

2. **Re-shoot with Tips**
   - Place watch on plain white paper
   - Use window light
   - Center in frame
   - Upload again

3. **Second Analysis**
   - Score: 68/100 (C grade)
   - "Good framing, could use brightness boost"

4. **Click Auto-Enhance**
   - AI adjusts brightness +20%
   - Enhances contrast
   - Sharpens details
   - New score: 82/100 (B+ grade)

5. **Result**
   - Professional-looking product photo
   - Ready for listing
   - Increased buyer confidence

---

## Advanced: Understanding Photo Coaching

The AI analyzes your photos like a professional photographer would:

### Composition
- Is the item centered?
- Does it fill the frame?
- Is there negative space?
- Are edges cut off?

### Lighting
- Is it evenly lit?
- Are there harsh shadows?
- Is it too dark/bright?
- Is color accurate?

### Technical Quality
- Is focus sharp?
- Is there motion blur?
- Are details visible?
- Is resolution sufficient?

### Professional Standards
- Clean background?
- Professional presentation?
- Seller credibility?
- Buyer appeal?

---

## Cost & Performance

### API Costs (Gemini)
- ~$0.001 per image analyzed
- First 1000 images often free
- Very affordable for most users

### Processing Time
- **Analysis:** 2-3 seconds
- **Enhancement:** 1-2 seconds (client-side)
- **Total:** ~4-5 seconds per image

### Limitations
- Max 5MB per image (Supabase limit)
- JPG, PNG, WebP supported
- Enhancement is basic (not AI-based background removal)
- Analysis requires internet

---

## Troubleshooting

### Build Errors
```bash
# If you see import errors
npm install @google/generative-ai

# If TypeScript errors
npm run typecheck
```

### Runtime Errors
```bash
# Check console (F12 in browser)
# Common issues:
- CORS errors → Image URL must be public
- 413 errors → Image too large (>5MB)
- 401 errors → Invalid API key
```

### Network Issues
- Gemini API requires internet
- Check firewall settings
- Verify API quota limits
- Try VPN if blocked in region

---

## Next Steps

### Try Different Photos
- Product with clean background (should score high)
- Product in messy room (should detect clutter)
- Dark photo (should recommend brightness)
- Blurry photo (should recommend re-shoot)

### Experiment with Enhancement
- Upload same photo multiple times
- Try enhance → analyze again
- Compare scores before/after
- Learn what makes great product photos

### Share Feedback
- What scores seem accurate?
- What suggestions were helpful?
- Any false positives?
- Feature requests?

---

## FAQ

**Q: Do I need both OpenAI AND Gemini keys?**
A: 
- OpenAI: For description generation & BidBot (Phases 1 & 2)
- Gemini: For image enhancement (Phase 3)
- Each is optional - features gracefully disable if not configured

**Q: Can I use this for listing photos I already uploaded?**
A: Currently only works during listing creation. Feature to enhance existing listings coming soon.

**Q: Does enhancement actually improve sales?**
A: Studies show professional photos increase sales by 30-50%. Better presentation = more trust = higher bids.

**Q: Will enhancement make my photo unrealistic?**
A: No! Enhancements are subtle (brightness, contrast, sharpening). The goal is to make photos look professionally taken, not fake.

**Q: What if I don't like the enhanced version?**
A: Original is always preserved. Enhanced version is added as a new image. You can delete either one.

**Q: Can I batch-process multiple photos?**
A: Not yet - analyze one at a time currently. Batch processing planned for future release.

---

**Ready to create professional listings? Upload your first photo and see the magic!** ✨

