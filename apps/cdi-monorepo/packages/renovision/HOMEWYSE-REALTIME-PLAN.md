# Homewyse Integration - Future Enhancement

## Current Status

The AI estimate generator currently uses **Gemini's built-in knowledge** of construction costs combined with **professional estimating guidelines**. It simulates the methodology used by Homewyse.com calculators but doesn't fetch live data.

## Your Original Idea (Correct!)

Instead of storing Homewyse data, we should have the AI **actually visit Homewyse.com** and scrape cost estimates in real-time - just like a human would.

### Benefits:
- ✅ Always up-to-date pricing (no maintenance)
- ✅ No copyright/data storage issues  
- ✅ Uses their actual regional calculators
- ✅ More accurate and current estimates

## Implementation Plan

### Option 1: Real-Time Web Scraping (Recommended)

```typescript
// Backend API endpoint
POST /api/fetch-homewyse-cost

Request:
{
  "task": "paint-room",
  "zipCode": "10001",
  "quantity": "200",  // square feet
  "quantityType": "square_foot"
}

Response:
{
  "taskName": "Paint Room",
  "averageCost": 1200,
  "lowCost": 900,
  "highCost": 1500,
  "laborCost": 600,
  "materialCost": 600,
  "zipCode": "10001",
  "source": "homewyse.com",
  "fetchedAt": "2025-10-31T10:30:00Z"
}
```

### Implementation Steps:

1. **Create Backend Scraper Service**
   ```bash
   npm install puppeteer
   # or
   npm install playwright
   ```

2. **Scraper Logic** (example with Puppeteer):
   ```typescript
   async function scrapeHomewyse(task: string, zipCode: string, quantity: number) {
     const browser = await puppeteer.launch();
     const page = await browser.newPage();
     
     // Navigate to Homewyse calculator
     await page.goto(`https://www.homewyse.com/costs/${task}`);
     
     // Fill in ZIP code
     await page.type('#zipcode-input', zipCode);
     
     // Fill in quantity if applicable
     if (quantity) {
       await page.type('#quantity-input', quantity.toString());
     }
     
     // Submit form
     await page.click('#calculate-button');
     await page.waitForSelector('.cost-result');
     
     // Extract cost data
     const costData = await page.evaluate(() => {
       return {
         averageCost: parseFloat(document.querySelector('.average-cost')?.textContent || '0'),
         lowCost: parseFloat(document.querySelector('.low-cost')?.textContent || '0'),
         highCost: parseFloat(document.querySelector('.high-cost')?.textContent || '0'),
         laborCost: parseFloat(document.querySelector('.labor-cost')?.textContent || '0'),
         materialCost: parseFloat(document.querySelector('.material-cost')?.textContent || '0'),
       };
     });
     
     await browser.close();
     return costData;
   }
   ```

3. **Cache Results** (avoid excessive scraping):
   ```typescript
   // Cache for 24 hours
   const cacheKey = `homewyse:${task}:${zipCode}:${quantity}`;
   const cached = await redis.get(cacheKey);
   if (cached) return JSON.parse(cached);
   
   const result = await scrapeHomewyse(task, zipCode, quantity);
   await redis.setex(cacheKey, 86400, JSON.stringify(result)); // 24 hours
   return result;
   ```

4. **Update AI Prompt** to use real data:
   ```typescript
   const homewyseData = await fetch('/api/fetch-homewyse-cost', {
     method: 'POST',
     body: JSON.stringify({ task: 'paint-room', zipCode, quantity })
   }).then(r => r.json());
   
   // Include in AI prompt:
   // "Based on Homewyse.com data for ${zipCode}:
   // - Average cost: $${homewyseData.averageCost}
   // - Labor: $${homewyseData.laborCost}
   // - Materials: $${homewyseData.materialCost}"
   ```

### Option 2: Homewyse API Partnership (Ideal)

Contact Homewyse to discuss:
- Official API access
- Partnership for nonprofit pricing
- White-label calculator embedding

### Option 3: AI Web Browsing (Emerging)

Use AI models with web browsing capabilities:
- GPT-4 with Browsing
- Claude with Web Access
- Gemini with Real-Time Search

These can visit Homewyse directly and extract data without custom scrapers.

## Ethical Considerations

1. **Respect robots.txt**: Always check Homewyse's robots.txt before scraping
2. **Rate Limiting**: Max 1 request per second, use caching
3. **Terms of Service**: Review Homewyse TOS for scraping policies
4. **Attribution**: Always credit Homewyse when using their data
5. **Partnership**: Best approach is to contact them for official API

## Current Workaround

Until real-time scraping is implemented, the AI uses:
- Industry-standard cost estimation principles
- Regional pricing adjustments
- Professional contractor knowledge
- 2025 market rates from training data

This provides good estimates but isn't as current as live Homewyse data would be.

## Next Steps

1. **Short-term**: Current AI approach (works well, no external dependencies)
2. **Medium-term**: Build web scraper with caching (most practical)
3. **Long-term**: Homewyse partnership or API access (best solution)

## Files

- `homewyseScraperService.ts` - Template for future scraper implementation
- `homewyseService.ts` - Current static methodology (can be removed later)
- `geminiService.ts` - AI estimation with professional guidelines

---

**Your insight was correct!** We should scrape Homewyse in real-time rather than duplicating their data. The backend scraper approach is the best path forward.
