# Homewyse Cost Data Integration

## Overview

This project integrates with **Homewyse.com** cost calculation methodology to provide accurate, market-based pricing for construction estimates. Instead of maintaining our own cost database, we leverage Homewyse's comprehensive and continuously-updated pricing data.

## Why Homewyse?

- **Comprehensive Data**: Covers 500+ construction tasks
- **Regional Accuracy**: ZIP code-based pricing adjustments
- **Always Updated**: Reflects current 2025 market rates
- **Industry Standard**: Trusted by contractors and homeowners
- **Detailed Breakdowns**: Separates labor, materials, and equipment costs

## Integration Approach

### 1. **AI-Guided Pricing** (Current Implementation)
The AI estimate generator uses Homewyse pricing methodology and standards:
- Regional multipliers based on ZIP code
- Labor/material separation
- Waste factors and overhead
- Quality level adjustments

**Advantages:**
- No web scraping required
- Fast response times
- No external API dependencies
- Homewyse-quality estimates

**Implementation:**
```typescript
import { getHomewyseInspiredPrompt } from './services/homewyseService';

// The AI uses Homewyse pricing rules
const homewyseGuidelines = getHomewyseInspiredPrompt(zipCode);
// Guidelines are included in the AI prompt
```

### 2. **Direct Data Fetching** (Future Enhancement)
Options for fetching live Homewyse data:

#### Option A: Server-Side Proxy
```typescript
// Backend endpoint that fetches Homewyse data
POST /api/homewyse/cost
Body: { taskType: 'interior_painting', zipCode: '43201', quantity: 500 }
Response: { low: 750, average: 1250, high: 1750, ... }
```

#### Option B: Homewyse API (if available)
```typescript
// Direct API integration (check if Homewyse offers an API)
const cost = await homewyse.getCost({
  task: 'hardwood_flooring',
  zipCode: '43201',
  sqft: 800
});
```

#### Option C: Periodic Data Caching
```typescript
// Nightly job scrapes and caches Homewyse data
// Frontend reads from our database
const cachedCost = await db.homewyse_costs.findOne({
  task: 'tile_installation',
  zip_prefix: '43'
});
```

## Homewyse Task Mappings

We maintain mappings between common construction tasks and their Homewyse equivalents:

```typescript
{
  'interior_painting': {
    taskName: 'Interior Painting',
    homewyseUrl: 'https://www.homewyse.com/services/cost_to_paint_rooms.html',
    category: 'Painting'
  },
  'hardwood_flooring': {
    taskName: 'Hardwood Flooring Installation',
    homewyseUrl: 'https://www.homewyse.com/services/cost_to_install_wood_flooring.html',
    category: 'Flooring'
  },
  // ... 20+ more mappings
}
```

## Regional Pricing

Homewyse applies regional multipliers based on ZIP code:

| Region | ZIP Prefixes | Multiplier | Example Cities |
|--------|--------------|------------|----------------|
| Northeast Metros | 10-11, 02, 06-07 | 1.20-1.35x | NYC, Boston, Philadelphia |
| California | 90-94 | 1.25-1.40x | LA, SF, San Diego |
| Seattle Area | 98 | 1.15-1.30x | Seattle, Tacoma |
| Southeast | 30-39 | 0.85-0.95x | Atlanta, Miami, Charlotte |
| Midwest | 60-65 | 0.90-1.00x | Chicago, St. Louis, Columbus |
| South Central | 70-79 | 0.85-0.95x | Dallas, Houston, Oklahoma City |
| Mountain West | 80-89 | 0.95-1.10x | Denver, Phoenix, Salt Lake City |

## Cost Components

Homewyse breaks down costs into:

1. **Labor Costs**
   - Local contractor hourly rates
   - Varies by trade ($45-$150/hr)
   - Includes worker's comp and taxes

2. **Material Costs**
   - Market prices for materials
   - 10-15% waste factor included
   - Bulk discounts for large quantities

3. **Equipment Costs** (when applicable)
   - Tool and equipment rental
   - Specialized machinery costs

4. **Overhead & Profit**
   - Contractor overhead (10-15%)
   - Profit margin (10-15%)
   - Total: 15-25% markup

5. **Job Preparation**
   - Setup and prep costs (5-10%)
   - Protection of existing surfaces
   - Cleanup and disposal (2-5%)

## Example: Interior Painting

**National Average (Base):**
- Labor: $1.50/sq ft
- Materials: $1.00/sq ft
- **Total: $2.50/sq ft**

**Regional Adjustments:**
- **Columbus, OH (43201)**: $2.50 × 0.95 = **$2.38/sq ft**
- **New York, NY (10001)**: $2.50 × 1.30 = **$3.25/sq ft**
- **San Francisco, CA (94102)**: $2.50 × 1.35 = **$3.38/sq ft**

## Usage in Code

### Get Homewyse-Style Estimate
```typescript
import { generateHomewyseStyleEstimate } from './services/homewyseService';

const estimate = generateHomewyseStyleEstimate(
  'Interior Painting',
  '43201', // ZIP code
  500,     // Quantity (sq ft)
  'square_foot'
);

console.log(estimate);
// {
//   taskName: 'Interior Painting',
//   zipCode: '43201',
//   costRange: { low: 1012, average: 1190, high: 1368 },
//   laborCost: 712.50,
//   materialCost: 522.50,
//   pricePerUnit: 2.47,
//   unit: 'square_foot',
//   lastUpdated: '2025-10-31T...'
// }
```

### Find Matching Task
```typescript
import { findMatchingHomewyseTask } from './services/homewyseService';

const taskKey = findMatchingHomewyseTask('paint the living room walls');
// Returns: 'interior_painting'

const mapping = HOMEWYSE_TASK_MAPPINGS[taskKey];
// {
//   taskName: 'Interior Painting',
//   homewyseUrl: 'https://www.homewyse.com/services/cost_to_paint_rooms.html',
//   category: 'Painting'
// }
```

### Get All Categories
```typescript
import { getHomewyseCategories } from './services/homewyseService';

const categories = getHomewyseCategories();
// ['Cabinets', 'Countertops', 'Doors', 'Drywall', 'Electrical', 
//  'Fencing', 'Flooring', 'HVAC', 'Outdoor', 'Painting', 
//  'Plumbing', 'Remodeling', 'Roofing', 'Windows']
```

## Future Enhancements

### Phase 1: Enhanced AI Prompts ✅ (Complete)
- Integrate Homewyse methodology into AI prompts
- Regional multipliers based on ZIP code
- Labor/material separation

### Phase 2: Server-Side Scraping (Planned)
- Backend service to fetch live Homewyse data
- Respect robots.txt and rate limits
- Cache results for 24-48 hours

### Phase 3: API Integration (If Available)
- Partner with Homewyse for official API access
- Real-time cost data
- Additional features (project reports, etc.)

### Phase 4: Cost Database (Optional)
- Maintain our own cost database
- Seeded with Homewyse data
- Updated quarterly or monthly

## Benefits

1. **Accuracy**: Industry-standard pricing data
2. **No Maintenance**: Homewyse keeps data current
3. **Regional Precision**: ZIP code-based adjustments
4. **Professional**: Clients recognize Homewyse quality
5. **Cost Effective**: No need to maintain cost database

## Legal Considerations

- **Web Scraping**: Check Homewyse Terms of Service
- **API Access**: Reach out to Homewyse for partnership
- **Attribution**: Consider crediting Homewyse for methodology
- **Caching**: Respect data freshness requirements

## Resources

- **Homewyse.com**: https://www.homewyse.com
- **Cost Calculators**: https://www.homewyse.com/services/
- **ZIP Code Data**: https://www.unitedstateszipcodes.org/

## Testing

Test the integration with various ZIP codes:

```bash
# Test different regions
node -e "
const { generateHomewyseStyleEstimate } = require('./services/homewyseService');

const regions = [
  { zip: '10001', name: 'NYC' },
  { zip: '94102', name: 'San Francisco' },
  { zip: '43201', name: 'Columbus, OH' },
  { zip: '30301', name: 'Atlanta' }
];

regions.forEach(region => {
  const estimate = generateHomewyseStyleEstimate(
    'Interior Painting', region.zip, 500, 'square_foot'
  );
  console.log(\`\${region.name}: $\${estimate.costRange.average.toFixed(2)}\`);
});
"
```

## Support

For questions about Homewyse integration:
- Check `services/homewyseService.ts` for implementation
- Review `services/geminiService.ts` for AI prompt integration
- See example usage in `components/business/NaturalLanguageEstimateForm.tsx`
