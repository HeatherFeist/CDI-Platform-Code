/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Homewyse Cost Data Service
 * 
 * This service integrates with Homewyse cost calculators to get accurate,
 * up-to-date pricing data for construction projects. Instead of maintaining
 * our own cost database, we leverage Homewyse's comprehensive data.
 * 
 * Homewyse provides cost calculators for hundreds of construction tasks:
 * - Painting, flooring, roofing, plumbing, electrical, etc.
 * - Regional pricing adjustments based on ZIP code
 * - Low, average, and high cost ranges
 * - Material and labor breakdowns
 */

export interface HomewyseTaskMapping {
    taskName: string;
    homewyseUrl: string;
    category: string;
}

export interface HomewyseCostData {
    taskName: string;
    zipCode: string;
    costRange: {
        low: number;
        average: number;
        high: number;
    };
    laborCost: number;
    materialCost: number;
    pricePerUnit: number;
    unit: string;
    lastUpdated: string;
}

/**
 * Common construction tasks mapped to Homewyse calculators
 * Add more mappings as needed
 */
export const HOMEWYSE_TASK_MAPPINGS: Record<string, HomewyseTaskMapping> = {
    'interior_painting': {
        taskName: 'Interior Painting',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_paint_rooms.html',
        category: 'Painting'
    },
    'exterior_painting': {
        taskName: 'Exterior Painting',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_paint_house_exterior.html',
        category: 'Painting'
    },
    'hardwood_flooring': {
        taskName: 'Hardwood Flooring Installation',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_install_wood_flooring.html',
        category: 'Flooring'
    },
    'carpet_installation': {
        taskName: 'Carpet Installation',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_install_carpet.html',
        category: 'Flooring'
    },
    'tile_installation': {
        taskName: 'Tile Installation',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_install_tile_flooring.html',
        category: 'Flooring'
    },
    'drywall_installation': {
        taskName: 'Drywall Installation',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_install_drywall.html',
        category: 'Drywall'
    },
    'drywall_repair': {
        taskName: 'Drywall Repair',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_repair_drywall.html',
        category: 'Drywall'
    },
    'roof_shingles': {
        taskName: 'Asphalt Shingle Roof',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_install_asphalt_shingle_roof.html',
        category: 'Roofing'
    },
    'kitchen_cabinets': {
        taskName: 'Kitchen Cabinet Installation',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_install_kitchen_cabinets.html',
        category: 'Cabinets'
    },
    'countertops_granite': {
        taskName: 'Granite Countertop Installation',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_install_granite_countertops.html',
        category: 'Countertops'
    },
    'countertops_quartz': {
        taskName: 'Quartz Countertop Installation',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_install_quartz_countertops.html',
        category: 'Countertops'
    },
    'bathroom_remodel': {
        taskName: 'Bathroom Remodel',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_remodel_bathroom.html',
        category: 'Remodeling'
    },
    'kitchen_remodel': {
        taskName: 'Kitchen Remodel',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_remodel_kitchen.html',
        category: 'Remodeling'
    },
    'fence_wood': {
        taskName: 'Wood Fence Installation',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_install_wood_fence.html',
        category: 'Fencing'
    },
    'deck_wood': {
        taskName: 'Wood Deck Construction',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_build_wood_deck.html',
        category: 'Outdoor'
    },
    'window_replacement': {
        taskName: 'Window Replacement',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_install_windows.html',
        category: 'Windows'
    },
    'door_installation': {
        taskName: 'Interior Door Installation',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_install_interior_door.html',
        category: 'Doors'
    },
    'hvac_installation': {
        taskName: 'HVAC System Installation',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_install_hvac_system.html',
        category: 'HVAC'
    },
    'electrical_outlet': {
        taskName: 'Electrical Outlet Installation',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_install_electrical_outlet.html',
        category: 'Electrical'
    },
    'plumbing_fixture': {
        taskName: 'Plumbing Fixture Installation',
        homewyseUrl: 'https://www.homewyse.com/services/cost_to_install_plumbing_fixture.html',
        category: 'Plumbing'
    }
};

/**
 * Fetch cost data from Homewyse for a specific task and ZIP code
 * 
 * This function implements real-time Homewyse data fetching using a CORS proxy
 * and web scraping techniques to get accurate, current pricing data.
 */
export const fetchHomewyseCostData = async (
    taskKey: string,
    zipCode: string,
    quantity: number = 1
): Promise<HomewyseCostData | null> => {
    try {
        const mapping = HOMEWYSE_TASK_MAPPINGS[taskKey];
        if (!mapping) {
            console.warn(`No Homewyse mapping found for task: ${taskKey}`);
            return null;
        }

        console.log(`Fetching real Homewyse data for ${mapping.taskName} in ZIP ${zipCode}`);
        
        // Use a CORS proxy to fetch Homewyse data
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const homewyseUrl = `${mapping.homewyseUrl}?location=${zipCode}`;
        const response = await fetch(`${proxyUrl}${encodeURIComponent(homewyseUrl)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const htmlContent = data.contents;
        
        // Parse the HTML to extract cost data
        const costData = parseHomewysePage(htmlContent, mapping.taskName, zipCode);
        
        if (costData) {
            console.log('Successfully fetched Homewyse data:', costData);
            return costData;
        } else {
            console.warn('Could not parse Homewyse data, falling back to generated estimate');
            return generateHomewyseStyleEstimate(mapping.taskName, zipCode, quantity, 'square_foot');
        }
        
    } catch (error) {
        console.error('Error fetching Homewyse data:', error);
        console.log('Falling back to generated Homewyse-style estimate');
        
        // Fallback to generated estimate
        const mapping = HOMEWYSE_TASK_MAPPINGS[taskKey];
        if (mapping) {
            return generateHomewyseStyleEstimate(mapping.taskName, zipCode, quantity, 'square_foot');
        }
        return null;
    }
};

/**
 * Parse Homewyse HTML page to extract cost data
 */
const parseHomewysePage = (htmlContent: string, taskName: string, zipCode: string): HomewyseCostData | null => {
    try {
        // Create a temporary DOM to parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // Look for cost data in common Homewyse patterns
        const costSelectors = [
            '.cost-range',
            '.price-range', 
            '.cost-estimate',
            '[data-cost]',
            '.low-cost',
            '.high-cost',
            '.average-cost'
        ];
        
        let lowCost = 0, avgCost = 0, highCost = 0;
        let laborCost = 0, materialCost = 0;
        
        // Try to extract cost ranges
        costSelectors.forEach(selector => {
            const elements = doc.querySelectorAll(selector);
            elements.forEach(element => {
                const text = element.textContent || '';
                const costs = extractCostsFromText(text);
                if (costs.length >= 3) {
                    lowCost = costs[0];
                    avgCost = costs[1]; 
                    highCost = costs[2];
                }
            });
        });
        
        // Look for labor and material breakdown
        const laborElement = doc.querySelector('[data-labor], .labor-cost, .labor');
        if (laborElement) {
            const laborText = laborElement.textContent || '';
            const laborMatch = laborText.match(/\$?([\d,]+\.?\d*)/);
            if (laborMatch) {
                laborCost = parseFloat(laborMatch[1].replace(/,/g, ''));
            }
        }
        
        const materialElement = doc.querySelector('[data-material], .material-cost, .material');
        if (materialElement) {
            const materialText = materialElement.textContent || '';
            const materialMatch = materialText.match(/\$?([\d,]+\.?\d*)/);
            if (materialMatch) {
                materialCost = parseFloat(materialMatch[1].replace(/,/g, ''));
            }
        }
        
        // If we found valid cost data, return it
        if (avgCost > 0 || (laborCost > 0 && materialCost > 0)) {
            return {
                taskName,
                zipCode,
                costRange: {
                    low: lowCost || avgCost * 0.85,
                    average: avgCost || (laborCost + materialCost),
                    high: highCost || avgCost * 1.15
                },
                laborCost: laborCost || avgCost * 0.6,
                materialCost: materialCost || avgCost * 0.4,
                pricePerUnit: avgCost || (laborCost + materialCost),
                unit: 'square_foot', // Default unit
                lastUpdated: new Date().toISOString()
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error parsing Homewyse page:', error);
        return null;
    }
};

/**
 * Extract cost values from text content
 */
const extractCostsFromText = (text: string): number[] => {
    const costs: number[] = [];
    const costPattern = /\$?([\d,]+\.?\d*)/g;
    let match;
    
    while ((match = costPattern.exec(text)) !== null) {
        const cost = parseFloat(match[1].replace(/,/g, ''));
        if (cost > 0) {
            costs.push(cost);
        }
    }
    
    return costs.sort((a, b) => a - b);
};

/**
 * Enhanced AI prompt that instructs the AI to use Homewyse pricing methodology
 * This allows the AI to generate estimates similar to Homewyse without direct scraping
 */
export const getHomewyseInspiredPrompt = (zipCode: string): string => {
    return `
**Pricing Methodology - Use Homewyse Standards:**

You should estimate costs using the same methodology as Homewyse.com cost calculators:

1. **Regional Adjustments by ZIP Code:**
   - Base your estimates on ${zipCode} location
   - Apply regional cost multipliers based on:
     * Local labor rates
     * Material availability and shipping costs
     * Market demand and competition
     * Cost of living adjustments
   
2. **Cost Component Breakdown:**
   - Separate labor costs from material costs
   - Labor: Based on local contractor hourly rates ($45-$150/hr depending on trade and region)
   - Materials: Include 10-15% waste factor
   - Consider bulk discounts for larger quantities

3. **Quality Levels:**
   - Provide estimates for standard/mid-grade quality
   - Economy options: -20% from standard
   - Premium options: +30-50% from standard

4. **Regional Multipliers by ZIP Code Prefix:**
   - 10xxx-02xxx (Northeast major metros): 1.20-1.35x
   - 90xxx-94xxx (California metros): 1.25-1.40x
   - 98xxx (Seattle area): 1.15-1.30x
   - 30xxx-39xxx (Southeast): 0.85-0.95x
   - 60xxx-65xxx (Midwest): 0.90-1.00x
   - 70xxx-79xxx (South Central): 0.85-0.95x
   - 80xxx-89xxx (Mountain/West): 0.95-1.10x

5. **Common Task Pricing (adjust for region):**
   - Interior Painting: $1.50-$3.50/sq ft (labor $0.80-$2, materials $0.70-$1.50)
   - Hardwood Flooring: $8-$15/sq ft installed
   - Tile Work: $10-$25/sq ft installed
   - Drywall: $1.50-$3/sq ft installed
   - Kitchen Cabinets: $100-$300/linear ft
   - Granite Countertops: $50-$100/sq ft installed
   - Roofing (asphalt): $5-$12/sq ft
   - Wood Fence: $15-$30/linear ft
   - Window Replacement: $300-$800 per window

6. **Include in Every Estimate:**
   - Job preparation costs (5-10% of materials)
   - Cleanup and disposal (2-5% of total)
   - Permits if required (vary by location)
   - Contractor overhead and profit margin (15-25%)

Use these Homewyse-inspired guidelines to provide accurate, market-based pricing.
`;
};

/**
 * Find the best matching Homewyse task for a natural language description
 */
export const findMatchingHomewyseTask = (taskDescription: string): string | null => {
    const description = taskDescription.toLowerCase();
    
    // Simple keyword matching - could be enhanced with AI
    const keywords: Record<string, string[]> = {
        'interior_painting': ['paint', 'painting', 'interior paint', 'wall paint'],
        'exterior_painting': ['exterior paint', 'house paint', 'outside paint'],
        'hardwood_flooring': ['hardwood', 'wood floor', 'hardwood floor'],
        'carpet_installation': ['carpet', 'carpeting'],
        'tile_installation': ['tile', 'tile floor', 'ceramic', 'porcelain'],
        'drywall_installation': ['drywall', 'sheetrock', 'gypsum'],
        'drywall_repair': ['drywall repair', 'wall repair', 'hole repair'],
        'roof_shingles': ['roof', 'shingle', 'roofing', 'asphalt'],
        'kitchen_cabinets': ['cabinet', 'kitchen cabinet'],
        'countertops_granite': ['granite', 'granite counter'],
        'countertops_quartz': ['quartz', 'quartz counter'],
        'bathroom_remodel': ['bathroom remodel', 'bath remodel'],
        'kitchen_remodel': ['kitchen remodel'],
        'fence_wood': ['fence', 'wood fence'],
        'deck_wood': ['deck', 'wood deck', 'patio'],
        'window_replacement': ['window', 'windows'],
        'door_installation': ['door', 'interior door'],
        'hvac_installation': ['hvac', 'air conditioning', 'furnace', 'heating'],
        'electrical_outlet': ['outlet', 'electrical outlet', 'plug'],
        'plumbing_fixture': ['plumbing', 'fixture', 'faucet', 'sink']
    };

    for (const [taskKey, taskKeywords] of Object.entries(keywords)) {
        if (taskKeywords.some(keyword => description.includes(keyword))) {
            return taskKey;
        }
    }

    return null;
};

/**
 * Get all available Homewyse task categories
 */
export const getHomewyseCategories = (): string[] => {
    const categories = new Set<string>();
    Object.values(HOMEWYSE_TASK_MAPPINGS).forEach(mapping => {
        categories.add(mapping.category);
    });
    return Array.from(categories).sort();
};

/**
 * Get all tasks for a specific category
 */
export const getTasksByCategory = (category: string): HomewyseTaskMapping[] => {
    return Object.values(HOMEWYSE_TASK_MAPPINGS)
        .filter(mapping => mapping.category === category);
};

/**
 * Generate a fallback cost estimate using Homewyse pricing rules
 * This is used when we can't fetch live data from Homewyse
 */
export const generateHomewyseStyleEstimate = (
    taskName: string,
    zipCode: string,
    quantity: number,
    unit: string
): HomewyseCostData => {
    // Get regional multiplier based on ZIP code
    const zipPrefix = zipCode.substring(0, 2);
    let regionalMultiplier = 1.0;

    // Apply regional pricing
    if (['10', '11', '02', '06', '07'].includes(zipPrefix)) {
        regionalMultiplier = 1.25; // Northeast metros
    } else if (['90', '91', '92', '93', '94'].includes(zipPrefix)) {
        regionalMultiplier = 1.32; // California
    } else if (['98'].includes(zipPrefix)) {
        regionalMultiplier = 1.22; // Seattle
    } else if (['30', '31', '32', '33'].includes(zipPrefix)) {
        regionalMultiplier = 0.90; // Southeast
    } else if (['60', '61', '62', '63', '64', '65'].includes(zipPrefix)) {
        regionalMultiplier = 0.95; // Midwest
    } else if (['70', '71', '72', '73', '74', '75', '76', '77', '78', '79'].includes(zipPrefix)) {
        regionalMultiplier = 0.88; // South Central
    } else if (['80', '81', '82', '83', '84', '85', '86', '87', '88', '89'].includes(zipPrefix)) {
        regionalMultiplier = 1.05; // Mountain West
    }

    // Base prices per unit (national average) - these would ideally come from a database
    const basePrices: Record<string, { labor: number, material: number, unit: string }> = {
        'Interior Painting': { labor: 1.5, material: 1.0, unit: 'square_foot' },
        'Exterior Painting': { labor: 2.0, material: 1.5, unit: 'square_foot' },
        'Hardwood Flooring Installation': { labor: 5.0, material: 6.0, unit: 'square_foot' },
        'Carpet Installation': { labor: 2.0, material: 3.0, unit: 'square_foot' },
        'Tile Installation': { labor: 8.0, material: 7.0, unit: 'square_foot' },
        'Drywall Installation': { labor: 1.0, material: 0.8, unit: 'square_foot' },
        'Asphalt Shingle Roof': { labor: 3.5, material: 4.0, unit: 'square_foot' },
        'Kitchen Cabinet Installation': { labor: 100, material: 150, unit: 'linear_foot' },
        'Granite Countertop Installation': { labor: 30, material: 45, unit: 'square_foot' },
    };

    const pricing = basePrices[taskName] || { labor: 10, material: 10, unit: 'square_foot' };
    
    const laborCost = pricing.labor * regionalMultiplier * quantity;
    const materialCost = pricing.material * regionalMultiplier * quantity * 1.1; // 10% waste factor
    const total = laborCost + materialCost;

    return {
        taskName,
        zipCode,
        costRange: {
            low: total * 0.85,
            average: total,
            high: total * 1.15
        },
        laborCost,
        materialCost,
        pricePerUnit: (laborCost + materialCost) / quantity,
        unit: pricing.unit,
        lastUpdated: new Date().toISOString()
    };
};

export default {
    fetchHomewyseCostData,
    getHomewyseInspiredPrompt,
    findMatchingHomewyseTask,
    getHomewyseCategories,
    getTasksByCategory,
    generateHomewyseStyleEstimate,
    HOMEWYSE_TASK_MAPPINGS
};
