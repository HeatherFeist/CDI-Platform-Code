# ✅ Vertex AI Setup Checklist

## **What You Need to Do Right Now:**

### **Step 1: Enable Vertex AI API**
- [ ] Go to: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=gen-lang-client-0262440131
- [ ] Click the **"ENABLE"** button
- [ ] Wait for it to show "API enabled"

### **Step 2: Add IAM Permissions to Service Account**
- [ ] Go to: https://console.cloud.google.com/iam-admin/iam?project=gen-lang-client-0262440131
- [ ] Find your service account: `marketplace-integration-servic@gen-lang-client-0262440131.iam.gserviceaccount.com`
- [ ] Click the **pencil (edit) icon** next to it
- [ ] Click **"+ ADD ANOTHER ROLE"**
- [ ] Add these roles one by one:
  - `Vertex AI User`
  - `AI Platform Admin`
  - `Service Account Token Creator` (if not already there)
- [ ] Click **"SAVE"**

### **Step 3: Test the Connection**
Once you've completed steps 1 & 2, run this command:

```bash
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\Users\heath\Downloads\Auction App\Auction Platform\cdi-marketplace-service-account.json"; node test-vertex-ai.mjs
```

You should see:
```
✅ Vertex AI initialized successfully
✅ Gemini model initialized successfully  
🚀 Sending test prompt...
✅ AI Response received:
📝 [AI response about helping with marketplace listings]
🎉 Vertex AI integration test successful!
```

### **Step 4: Start Your Development Server**
```bash
npm run dev
```

Your app will have the AI chat assistant available in the bottom-right corner!

---

## **If You're Still Getting Permission Errors:**

### **Alternative: Use the Vertex AI Console**
1. Go to: https://console.cloud.google.com/vertex-ai?project=gen-lang-client-0262440131
2. Click **"Enable All Recommended APIs"**
3. Wait 5-10 minutes for everything to propagate

### **Check Your Project Billing**
- Vertex AI requires billing to be enabled
- Go to: https://console.cloud.google.com/billing?project=gen-lang-client-0262440131
- Make sure billing is enabled and you have credits

---

## **Current Status:**
- ✅ Environment variables configured
- ✅ Service account JSON file in place
- ✅ AI components built and ready
- 🔄 **Waiting for you to enable API & add permissions**
- ⏳ Test connection
- ⏳ Use AI features in your app

**Next Step:** Complete Step 1 & 2 above, then test! 🚀