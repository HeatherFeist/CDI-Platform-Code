/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Product Search Service
 * 
 * Searches major home improvement retailers (Lowes, Home Depot, Menards) 
 * for products and returns price comparisons in high/mid/low ranges.
 */

export interface ProductSearchResult {
    retailer: string;
    productName: string;
    brand: string;
    price: number;
    unit: string;
    coverage?: number; // Square feet covered per unit
    pricePerSqft?: number;
    imageUrl?: string;
    productUrl: string;
    inStock: boolean;
    rating?: number;
    reviewCount?: number;
    features: string[];
    category: string;
}

export interface ProductComparison {
    category: string;
    searchQuery: string;
    high: ProductSearchResult[];
    mid: ProductSearchResult[];
    low: ProductSearchResult[];
    averagePrices: {
        high: number;
        mid: number;
        low: number;
    };
    lastUpdated: string;
}

export interface ProductSearchParams {
    category: string;
    subcategory?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    coverage?: number; // Square feet needed
    zipCode?: string; // For availability checking
}

/**
 * Search multiple retailers for products and categorize by price range
 */
export const searchProducts = async (
    query: string,
    params: ProductSearchParams
): Promise<ProductComparison> => {
    console.log(`Searching for products: ${query}`, params);
    
    try {
        // Search all major retailers in parallel
        const [lowesResults, homeDepotResults, menardsResults] = await Promise.all([
            searchLowes(query, params),
            searchHomeDepot(query, params),
            searchMenards(query, params)
        ]);
        
        // Combine all results
        const allResults = [...lowesResults, ...homeDepotResults, ...menardsResults];
        
        // Categorize by price ranges
        const categorized = categorizeByPriceRange(allResults);
        
        // Calculate average prices
        const averagePrices = {
            high: calculateAveragePrice(categorized.high),
            mid: calculateAveragePrice(categorized.mid),
            low: calculateAveragePrice(categorized.low)
        };
        
        return {
            category: params.category,
            searchQuery: query,
            high: categorized.high,
            mid: categorized.mid,
            low: categorized.low,
            averagePrices,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error searching products:', error);
        throw error;
    }
};

/**
 * Search Lowes for products
 */
const searchLowes = async (query: string, params: ProductSearchParams): Promise<ProductSearchResult[]> => {
    try {
        const searchUrl = `https://www.lowes.com/search?searchTerm=${encodeURIComponent(query)}`;
        console.log(`Searching Lowes: ${searchUrl}`);
        
        // Use CORS proxy for web scraping
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const response = await fetch(`${proxyUrl}${encodeURIComponent(searchUrl)}`);
        
        if (!response.ok) {
            throw new Error(`Lowes search failed: ${response.status}`);
        }
        
        const data = await response.json();
        const htmlContent = data.contents;
        
        return parseLowesResults(htmlContent, params);
    } catch (error) {
        console.error('Error searching Lowes:', error);
        return []; // Return empty array on error
    }
};

/**
 * Search Home Depot for products
 */
const searchHomeDepot = async (query: string, params: ProductSearchParams): Promise<ProductSearchResult[]> => {
    try {
        const searchUrl = `https://www.homedepot.com/s/${encodeURIComponent(query)}`;
        console.log(`Searching Home Depot: ${searchUrl}`);
        
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const response = await fetch(`${proxyUrl}${encodeURIComponent(searchUrl)}`);
        
        if (!response.ok) {
            throw new Error(`Home Depot search failed: ${response.status}`);
        }
        
        const data = await response.json();
        const htmlContent = data.contents;
        
        return parseHomeDepotResults(htmlContent, params);
    } catch (error) {
        console.error('Error searching Home Depot:', error);
        return [];
    }
};

/**
 * Search Menards for products
 */
const searchMenards = async (query: string, params: ProductSearchParams): Promise<ProductSearchResult[]> => {
    try {
        const searchUrl = `https://www.menards.com/main/search.html?search=${encodeURIComponent(query)}`;
        console.log(`Searching Menards: ${searchUrl}`);
        
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const response = await fetch(`${proxyUrl}${encodeURIComponent(searchUrl)}`);
        
        if (!response.ok) {
            throw new Error(`Menards search failed: ${response.status}`);
        }
        
        const data = await response.json();
        const htmlContent = data.contents;
        
        return parseMenardsResults(htmlContent, params);
    } catch (error) {
        console.error('Error searching Menards:', error);
        return [];
    }
};

/**
 * Parse Lowes search results
 */
const parseLowesResults = (html: string, params: ProductSearchParams): ProductSearchResult[] => {
    const results: ProductSearchResult[] = [];
    
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Look for product cards in Lowes' typical structure
        const productCards = doc.querySelectorAll('[data-testid="product-card"], .art-oc-pdp-card');
        
        productCards.forEach((card, index) => {
            if (index >= 10) return; // Limit to 10 results per retailer
            
            try {
                const nameElement = card.querySelector('[data-testid="product-title"], .art-pd-title a');
                const priceElement = card.querySelector('[data-testid="price"], .art-pd-price');
                const imageElement = card.querySelector('img');
                const linkElement = card.querySelector('a');
                
                if (nameElement && priceElement) {
                    const name = nameElement.textContent?.trim() || '';
                    const priceText = priceElement.textContent?.trim() || '';
                    const price = extractPrice(priceText);
                    
                    if (price > 0) {
                        results.push({
                            retailer: 'Lowes',
                            productName: name,
                            brand: extractBrand(name),
                            price: price,
                            unit: 'each',
                            imageUrl: imageElement?.getAttribute('src') || undefined,
                            productUrl: linkElement?.getAttribute('href') || '',
                            inStock: true, // Assume in stock if listed
                            features: [],
                            category: params.category
                        });
                    }
                }
            } catch (error) {
                console.error('Error parsing Lowes product card:', error);
            }
        });
    } catch (error) {
        console.error('Error parsing Lowes HTML:', error);
    }
    
    return results;
};

/**
 * Parse Home Depot search results
 */
const parseHomeDepotResults = (html: string, params: ProductSearchParams): ProductSearchResult[] => {
    const results: ProductSearchResult[] = [];
    
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Look for product cards in Home Depot's structure
        const productCards = doc.querySelectorAll('[data-testid="product-pod"], .plp-pod');
        
        productCards.forEach((card, index) => {
            if (index >= 10) return;
            
            try {
                const nameElement = card.querySelector('[data-testid="product-title"], .plp-pod__title a');
                const priceElement = card.querySelector('[data-testid="price"], .price');
                const imageElement = card.querySelector('img');
                const linkElement = card.querySelector('a');
                
                if (nameElement && priceElement) {
                    const name = nameElement.textContent?.trim() || '';
                    const priceText = priceElement.textContent?.trim() || '';
                    const price = extractPrice(priceText);
                    
                    if (price > 0) {
                        results.push({
                            retailer: 'Home Depot',
                            productName: name,
                            brand: extractBrand(name),
                            price: price,
                            unit: 'each',
                            imageUrl: imageElement?.getAttribute('src') || undefined,
                            productUrl: linkElement?.getAttribute('href') || '',
                            inStock: true,
                            features: [],
                            category: params.category
                        });
                    }
                }
            } catch (error) {
                console.error('Error parsing Home Depot product card:', error);
            }
        });
    } catch (error) {
        console.error('Error parsing Home Depot HTML:', error);
    }
    
    return results;
};

/**
 * Parse Menards search results
 */
const parseMenardsResults = (html: string, params: ProductSearchParams): ProductSearchResult[] => {
    const results: ProductSearchResult[] = [];
    
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Look for product cards in Menards' structure
        const productCards = doc.querySelectorAll('.product-tile, .product-card');
        
        productCards.forEach((card, index) => {
            if (index >= 10) return;
            
            try {
                const nameElement = card.querySelector('.product-title, .product-name');
                const priceElement = card.querySelector('.price, .product-price');
                const imageElement = card.querySelector('img');
                const linkElement = card.querySelector('a');
                
                if (nameElement && priceElement) {
                    const name = nameElement.textContent?.trim() || '';
                    const priceText = priceElement.textContent?.trim() || '';
                    const price = extractPrice(priceText);
                    
                    if (price > 0) {
                        results.push({
                            retailer: 'Menards',
                            productName: name,
                            brand: extractBrand(name),
                            price: price,
                            unit: 'each',
                            imageUrl: imageElement?.getAttribute('src') || undefined,
                            productUrl: linkElement?.getAttribute('href') || '',
                            inStock: true,
                            features: [],
                            category: params.category
                        });
                    }
                }
            } catch (error) {
                console.error('Error parsing Menards product card:', error);
            }
        });
    } catch (error) {
        console.error('Error parsing Menards HTML:', error);
    }
    
    return results;
};

/**
 * Extract price from text
 */
const extractPrice = (priceText: string): number => {
    const cleanPrice = priceText.replace(/[^0-9.,]/g, '');
    const price = parseFloat(cleanPrice.replace(/,/g, ''));
    return isNaN(price) ? 0 : price;
};

/**
 * Extract brand from product name
 */
const extractBrand = (productName: string): string => {
    const commonBrands = [
        'DEWALT', 'Milwaukee', 'Ryobi', 'Black+Decker', 'Craftsman',
        'Kobalt', 'Husky', 'Hart', 'Project Source', 'Style Selections',
        'Harbor Breeze', 'Portfolio', 'Kichler', 'Moen', 'Delta',
        'American Standard', 'Kohler', 'Glacier Bay', 'Pfister',
        'Levolor', 'Bali', 'Hunter', 'Hampton Bay', 'Commercial Electric'
    ];
    
    for (const brand of commonBrands) {
        if (productName.toUpperCase().includes(brand.toUpperCase())) {
            return brand;
        }
    }
    
    // Try to extract first word as brand
    const words = productName.split(' ');
    return words[0] || 'Generic';
};

/**
 * Categorize products by price range
 */
const categorizeByPriceRange = (products: ProductSearchResult[]): {
    high: ProductSearchResult[];
    mid: ProductSearchResult[];
    low: ProductSearchResult[];
} => {
    if (products.length === 0) {
        return { high: [], mid: [], low: [] };
    }
    
    // Sort by price
    const sorted = products.sort((a, b) => a.price - b.price);
    
    // Calculate price thresholds
    const minPrice = sorted[0].price;
    const maxPrice = sorted[sorted.length - 1].price;
    const priceRange = maxPrice - minPrice;
    
    const lowThreshold = minPrice + (priceRange * 0.33);
    const highThreshold = minPrice + (priceRange * 0.67);
    
    return {
        low: sorted.filter(p => p.price <= lowThreshold),
        mid: sorted.filter(p => p.price > lowThreshold && p.price <= highThreshold),
        high: sorted.filter(p => p.price > highThreshold)
    };
};

/**
 * Calculate average price for a group of products
 */
const calculateAveragePrice = (products: ProductSearchResult[]): number => {
    if (products.length === 0) return 0;
    const total = products.reduce((sum, p) => sum + p.price, 0);
    return Math.round((total / products.length) * 100) / 100;
};

/**
 * Get product suggestions for common project categories
 */
export const getProductSuggestionsForProject = async (
    projectType: string,
    squareFeet: number,
    budget: 'low' | 'mid' | 'high' = 'mid'
): Promise<ProductComparison[]> => {
    const suggestions: ProductComparison[] = [];
    
    const projectQueries = getProjectQueries(projectType);
    
    for (const query of projectQueries) {
        try {
            const comparison = await searchProducts(query.searchTerm, {
                category: query.category,
                subcategory: query.subcategory
            });
            suggestions.push(comparison);
        } catch (error) {
            console.error(`Error searching for ${query.searchTerm}:`, error);
        }
    }
    
    return suggestions;
};

/**
 * Get search queries for different project types
 */
const getProjectQueries = (projectType: string): Array<{
    searchTerm: string;
    category: string;
    subcategory?: string;
}> => {
    switch (projectType.toLowerCase()) {
        case 'flooring':
        case 'hardwood':
            return [
                { searchTerm: 'hardwood flooring', category: 'Flooring', subcategory: 'Hardwood' },
                { searchTerm: 'underlayment', category: 'Flooring', subcategory: 'Accessories' },
                { searchTerm: 'wood stain', category: 'Paint', subcategory: 'Stain' },
                { searchTerm: 'polyurethane finish', category: 'Paint', subcategory: 'Finish' }
            ];
            
        case 'painting':
            return [
                { searchTerm: 'interior paint', category: 'Paint', subcategory: 'Interior' },
                { searchTerm: 'primer', category: 'Paint', subcategory: 'Primer' },
                { searchTerm: 'paint brushes', category: 'Tools', subcategory: 'Painting' },
                { searchTerm: 'paint rollers', category: 'Tools', subcategory: 'Painting' }
            ];
            
        case 'bathroom':
            return [
                { searchTerm: 'bathroom vanity', category: 'Bathroom', subcategory: 'Vanities' },
                { searchTerm: 'bathroom tile', category: 'Tile', subcategory: 'Bathroom' },
                { searchTerm: 'toilet', category: 'Plumbing', subcategory: 'Toilets' },
                { searchTerm: 'bathroom faucet', category: 'Plumbing', subcategory: 'Faucets' }
            ];
            
        case 'kitchen':
            return [
                { searchTerm: 'kitchen cabinets', category: 'Kitchen', subcategory: 'Cabinets' },
                { searchTerm: 'countertops', category: 'Kitchen', subcategory: 'Countertops' },
                { searchTerm: 'kitchen faucet', category: 'Plumbing', subcategory: 'Faucets' },
                { searchTerm: 'kitchen appliances', category: 'Appliances', subcategory: 'Kitchen' }
            ];
            
        default:
            return [
                { searchTerm: projectType, category: 'General' }
            ];
    }
};

export default {
    searchProducts,
    getProductSuggestionsForProject
};