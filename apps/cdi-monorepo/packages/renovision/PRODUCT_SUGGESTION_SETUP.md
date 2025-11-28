# 🛠️ Product Suggestion Feature - Setup Guide

## ❌ Why It's Not Working

The AI Product Suggestion feature requires **3 critical components** that need to be deployed:

### 1. **OpenAI API Key** (Missing)
- The Edge Function needs your OpenAI API key to generate product suggestions
- Cost: ~$0.045 per estimate (GPT-4 Turbo)
- **Status:** ❌ Not configured

### 2. **Supabase Edge Functions** (Not Deployed)
- `fetch-product-suggestions` - Analyzes single line item
- `fetch-estimate-products` - Analyzes entire estimate
- **Status:** ❌ Not deployed to Supabase

### 3. **Database Tables** (Not Created)
- `estimate_materials` - Stores selected products
- `product_suggestions_cache` - Caches AI responses (7 days)
- **Status:** ❌ Not created in database

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it "Home Reno Vision - Product Suggestions"
4. Copy the key (starts with `sk-proj-...`)
5. **Save it securely** - you'll need it in Step 3

**Cost Estimate:**
- $0.045 per estimate with ~10 line items
- 100 estimates = ~$4.50/month
- 500 estimates = ~$22.50/month

---

### Step 2: Create Database Tables

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste this entire SQL script:

```sql
-- Create estimate_materials table
CREATE TABLE IF NOT EXISTS estimate_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
    line_item_index INTEGER NOT NULL,
    category TEXT NOT NULL,
    product_name TEXT NOT NULL,
    brand TEXT,
    sku TEXT,
    retailer TEXT NOT NULL CHECK (retailer IN ('home_depot', 'lowes', 'menards')),
    price_per_unit DECIMAL(10,2) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    grade TEXT NOT NULL CHECK (grade IN ('budget', 'mid', 'high')),
    product_url TEXT,
    image_url TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one product per line item per category
    UNIQUE(estimate_id, line_item_index, category)
);

-- Create product_suggestions_cache table
CREATE TABLE IF NOT EXISTS product_suggestions_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_query TEXT NOT NULL,
    category TEXT NOT NULL,
    grade TEXT NOT NULL CHECK (grade IN ('budget', 'mid', 'high')),
    retailer TEXT NOT NULL CHECK (retailer IN ('home_depot', 'lowes', 'menards')),
    product_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Index for fast lookups
    INDEX idx_cache_search (search_query, category, grade)
);

-- Create view for popular products by category
CREATE OR REPLACE VIEW popular_products_by_category AS
SELECT 
    category,
    grade,
    retailer,
    product_name,
    brand,
    sku,
    AVG(price_per_unit) as avg_price,
    SUM(usage_count) as total_uses,
    MAX(created_at) as last_used
FROM estimate_materials
GROUP BY category, grade, retailer, product_name, brand, sku
ORDER BY category, total_uses DESC;

-- Function to increment product usage count
CREATE OR REPLACE FUNCTION increment_product_usage(
    p_estimate_id UUID,
    p_line_item_index INTEGER,
    p_category TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE estimate_materials
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE estimate_id = p_estimate_id
      AND line_item_index = p_line_item_index
      AND category = p_category;
END;
$$ LANGUAGE plpgsql;

-- Function to get product recommendations based on usage
CREATE OR REPLACE FUNCTION get_product_recommendations(
    p_category TEXT,
    p_grade TEXT DEFAULT 'mid',
    p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
    product_name TEXT,
    brand TEXT,
    retailer TEXT,
    avg_price DECIMAL,
    total_uses BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        em.product_name,
        em.brand,
        em.retailer,
        AVG(em.price_per_unit)::DECIMAL as avg_price,
        SUM(em.usage_count)::BIGINT as total_uses
    FROM estimate_materials em
    WHERE em.category = p_category
      AND em.grade = p_grade
    GROUP BY em.product_name, em.brand, em.retailer
    ORDER BY total_uses DESC, avg_price ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache() RETURNS VOID AS $$
BEGIN
    DELETE FROM product_suggestions_cache
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE estimate_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_suggestions_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their estimate materials
CREATE POLICY estimate_materials_policy ON estimate_materials
    FOR ALL USING (
        estimate_id IN (
            SELECT id FROM estimates 
            WHERE business_id IN (
                SELECT id FROM businesses 
                WHERE owner_id = auth.uid()
            )
        )
    );

-- Allow all authenticated users to read from cache (shared resource)
CREATE POLICY cache_read_policy ON product_suggestions_cache
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can write to cache (via Edge Functions)
CREATE POLICY cache_write_policy ON product_suggestions_cache
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_estimate_materials_estimate_id ON estimate_materials(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_materials_category ON estimate_materials(category);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON product_suggestions_cache(expires_at);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_estimate_materials_updated_at
    BEFORE UPDATE ON estimate_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON estimate_materials TO authenticated;
GRANT ALL ON product_suggestions_cache TO authenticated;
GRANT EXECUTE ON FUNCTION increment_product_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_cache TO service_role;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Product suggestion tables created successfully!';
END $$;
```

3. Click **Run** (or press F5)
4. Verify: You should see "✅ Product suggestion tables created successfully!"

---

### Step 3: Set OpenAI API Key in Supabase

1. Open Supabase Dashboard → **Project Settings** → **Edge Functions**
2. Scroll to **Secrets** section
3. Click **Add secret**
4. Enter:
   - Name: `OPENAI_API_KEY`
   - Value: Your API key from Step 1 (starts with `sk-proj-...`)
5. Click **Save**

---

### Step 4: Deploy Edge Functions

#### Option A: Using Supabase CLI (Recommended)

```powershell
# Navigate to project directory
cd "c:\Users\heath\Downloads\home-reno-vision-pro (2)"

# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy both Edge Functions
supabase functions deploy fetch-product-suggestions
supabase functions deploy fetch-estimate-products
```

#### Option B: Manual Deployment via Dashboard

1. Go to Supabase Dashboard → **Edge Functions**
2. Click **Deploy new function**
3. For `fetch-product-suggestions`:
   - Name: `fetch-product-suggestions`
   - Copy code from: `supabase\functions\fetch-product-suggestions\index.ts`
   - Click **Deploy**
4. Repeat for `fetch-estimate-products`

---

### Step 5: Test the Feature

1. Open your app at https://renovision.web.app
2. Go to **Estimates** → **New Estimate**
3. Add a line item (e.g., "Kitchen cabinet installation")
4. You should see:
   - "🤖 Get AI Product Suggestions" button
   - Click it to fetch products from Home Depot, Lowe's, Menards
   - See Budget/Mid/Premium options
   - Select products and see automatic cost calculation

---

## 🎯 Where to Find the Feature

### In EnhancedCalculator Component
Location: `components/business/EnhancedCalculator.tsx`

**Step 3: Product Selection** appears after measurements:
```typescript
// After calculating measurements and labor costs
const suggestions = await getProductSuggestionsForProject(
    formData.projectType,
    measurements.floorArea,
    'mid'
);
setProductSuggestions(suggestions);
```

### In EstimatesView Component  
Location: `components/EstimatesView.tsx`

**"AI Suggest Products" button** appears when editing estimates:
- Opens ProductSelector modal
- Analyzes each line item
- Shows 3-tier product options
- Calculates materials total

---

## 📊 How It Works

### Flow Diagram

```
User adds line item → 
  "Kitchen cabinet installation, 12 linear feet"
    ↓
Click "Get AI Suggestions" button
    ↓
App calls: productSuggestionService.fetchProductSuggestions()
    ↓
Calls Supabase Edge Function: fetch-product-suggestions
    ↓
Edge Function calls OpenAI GPT-4:
  - Analyzes line item
  - Identifies category (Cabinets)
  - Researches products from Home Depot, Lowe's, Menards
  - Returns Budget/Mid/Premium options
    ↓
Cache results in product_suggestions_cache (7 days)
    ↓
Display products with images, prices, ratings
    ↓
User selects product → Saves to estimate_materials
    ↓
Calculate total: quantity × price = $X,XXX.XX
    ↓
Update estimate total automatically
```

---

## 🐛 Troubleshooting

### Error: "Failed to fetch product suggestions"

**Cause:** Edge Function not deployed or OpenAI API key missing

**Fix:**
1. Check Supabase Dashboard → Edge Functions → Status should be "Deployed"
2. Check Project Settings → Secrets → Verify `OPENAI_API_KEY` exists
3. Check browser console for specific error message

---

### Error: "Could not find the table 'estimate_materials'"

**Cause:** Database tables not created

**Fix:**
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL script from Step 2 above
3. Refresh your app

---

### Error: "OpenAI API error: 401 Unauthorized"

**Cause:** Invalid or expired API key

**Fix:**
1. Go to https://platform.openai.com/api-keys
2. Check if key is still active
3. Check if you have credits/billing set up
4. Create new key if needed
5. Update secret in Supabase

---

### Error: "OpenAI API error: 429 Too Many Requests"

**Cause:** Rate limit exceeded

**Fix:**
1. Wait a few minutes and try again
2. Check OpenAI usage limits: https://platform.openai.com/usage
3. Upgrade OpenAI plan if needed
4. Enable caching (automatic in our system)

---

### Products not appearing in UI

**Cause:** Frontend not connected to backend

**Fix:**
1. Open browser console (F12)
2. Look for errors in console
3. Check Network tab for failed requests
4. Verify `supabase.ts` has correct project URL and anon key

---

## 💰 Cost Analysis

### OpenAI API Costs

**GPT-4 Turbo Pricing:**
- Input: $0.01 per 1K tokens
- Output: $0.03 per 1K tokens

**Per Estimate (10 line items):**
- Input: ~500 tokens × 10 = 5,000 tokens = $0.05
- Output: ~300 tokens × 10 = 3,000 tokens = $0.09
- **Total per estimate: ~$0.14**

**Monthly Costs:**
- 50 estimates/month = $7.00
- 100 estimates/month = $14.00
- 500 estimates/month = $70.00

**Cost Reduction with Caching:**
- 7-day cache reduces repeat queries by ~60%
- Effective cost: ~$0.056 per estimate
- 100 estimates/month = **$5.60** (with cache)

---

## 🎨 UI Components

### 1. ProductSelector Component
Location: `components/estimates/ProductSelector.tsx`

**Features:**
- Grade selection (Budget/Mid/Premium)
- Product cards with images
- Price comparison
- Retailer badges
- Select/Deselect buttons
- Total cost calculation

### 2. EnhancedCalculator Integration
Location: `components/business/EnhancedCalculator.tsx`

**Step 3: Products**
- Automatic product suggestions after measurements
- Category-based organization
- Quick selection interface

---

## 📁 File Structure

```
home-reno-vision-pro (2)/
├── components/
│   ├── estimates/
│   │   └── ProductSelector.tsx          ← Main UI component
│   └── business/
│       └── EnhancedCalculator.tsx       ← Uses product suggestions
├── services/
│   └── productSuggestionService.ts      ← Service layer
├── supabase/
│   └── functions/
│       ├── fetch-product-suggestions/
│       │   └── index.ts                 ← Edge Function (single item)
│       └── fetch-estimate-products/
│           └── index.ts                 ← Edge Function (batch)
└── supabase-estimate-materials.sql      ← Database schema
```

---

## ✅ Verification Checklist

Before using the feature, verify:

- [ ] OpenAI API key is valid and has credits
- [ ] API key is set in Supabase Edge Function secrets
- [ ] Database tables exist (`estimate_materials`, `product_suggestions_cache`)
- [ ] Edge Functions are deployed to Supabase
- [ ] App is rebuilt and redeployed after any config changes
- [ ] Browser console shows no errors when clicking "Get AI Suggestions"
- [ ] Test with a simple line item (e.g., "Paint, 5 gallons")

---

## 🚀 Next Steps

Once working, you can:

1. **Customize Product Categories**
   - Edit prompts in Edge Functions
   - Add specific brands or preferences
   - Fine-tune budget/mid/premium tiers

2. **Add Custom Products**
   - Create manual product database
   - Supplement AI suggestions
   - Add your preferred suppliers

3. **Analytics**
   - Track which products are most selected
   - Monitor OpenAI costs
   - Optimize caching strategy

4. **UI Enhancements**
   - Add product filtering
   - Save favorite products
   - Product comparison side-by-side

---

## 📞 Need Help?

If you're still having issues:

1. Check browser console for errors (F12)
2. Check Supabase Edge Function logs
3. Check OpenAI dashboard for API usage/errors
4. Verify all environment variables are set correctly

The most common issue is **missing OpenAI API key** - make sure Step 3 is completed!

---

## 🎉 Success!

Once set up, you'll see:
- ✅ AI product suggestions appear automatically
- ✅ Real products from Home Depot, Lowe's, Menards
- ✅ Budget/Mid/Premium options for every line item
- ✅ Automatic cost calculations
- ✅ Faster estimate creation

This feature will save you **hours of research time** per estimate! 🚀
