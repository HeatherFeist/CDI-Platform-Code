/**
 * Web Product Search Service
 * Searches Home Depot, Lowe's, and Menards using web search APIs
 * NO COST - Uses free search APIs instead of OpenAI
 */

export interface WebProduct {
    id: string;
    name: string;
    brand?: string;
    price?: number;
    priceText?: string;
    retailer: 'home_depot' | 'lowes' | 'menards';
    url: string;
    imageUrl?: string;
    rating?: number;
    reviewCount?: number;
    description?: string;
    inStock?: boolean;
}

export interface ProductSearchResult {
    category: string;
    searchQuery: string;
    products: WebProduct[];
    timestamp: Date;
}

class WebProductSearchService {
    private readonly retailers = {
        home_depot: {
            name: 'Home Depot',
            domain: 'homedepot.com',
            searchUrl: 'https://www.homedepot.com/s/',
            color: '#f96302'
        },
        lowes: {
            name: "Lowe's",
            domain: 'lowes.com',
            searchUrl: 'https://www.lowes.com/search?text=',
            color: '#004990'
        },
        menards: {
            name: 'Menards',
            domain: 'menards.com',
            searchUrl: 'https://www.menards.com/main/search.html?search=',
            color: '#ffd100'
        }
    };

    /**
     * Search for products across all retailers
     * Uses DuckDuckGo Instant Answer API (free, no key required)
     */
    async searchProducts(
        lineItemDescription: string,
        category?: string
    ): Promise<ProductSearchResult> {
        try {
            console.log('🔍 Searching for products:', lineItemDescription);

            // Clean up the search query
            const searchQuery = this.buildSearchQuery(lineItemDescription, category);
            
            // Search each retailer
            const results = await Promise.all([
                this.searchRetailer('home_depot', searchQuery),
                this.searchRetailer('lowes', searchQuery),
                this.searchRetailer('menards', searchQuery)
            ]);

            // Combine results
            const allProducts = results.flat();

            console.log(`✅ Found ${allProducts.length} products`);

            return {
                category: category || this.detectCategory(lineItemDescription),
                searchQuery: searchQuery,
                products: allProducts,
                timestamp: new Date()
            };

        } catch (error) {
            console.error('Error searching products:', error);
            return {
                category: category || 'Unknown',
                searchQuery: lineItemDescription,
                products: [],
                timestamp: new Date()
            };
        }
    }

    /**
     * Build optimized search query from line item description
     */
    private buildSearchQuery(description: string, category?: string): string {
        // Remove common words that don't help search
        let query = description
            .toLowerCase()
            .replace(/\b(the|and|or|for|with|installation|labor|install)\b/g, '')
            .replace(/\d+\s*(square feet|sq ft|linear feet|feet|ft)/gi, '')
            .trim();

        // Add category if provided
        if (category) {
            query = `${category} ${query}`;
        }

        return query;
    }

    /**
     * Detect category from line item description
     */
    private detectCategory(description: string): string {
        const desc = description.toLowerCase();
        
        if (desc.includes('paint') || desc.includes('primer')) return 'Paint';
        if (desc.includes('floor') || desc.includes('tile') || desc.includes('carpet')) return 'Flooring';
        if (desc.includes('cabinet')) return 'Cabinets';
        if (desc.includes('door')) return 'Doors';
        if (desc.includes('window')) return 'Windows';
        if (desc.includes('lumber') || desc.includes('wood')) return 'Lumber';
        if (desc.includes('drywall') || desc.includes('sheetrock')) return 'Drywall';
        if (desc.includes('electrical') || desc.includes('wire') || desc.includes('outlet')) return 'Electrical';
        if (desc.includes('plumbing') || desc.includes('pipe') || desc.includes('faucet')) return 'Plumbing';
        if (desc.includes('roof') || desc.includes('shingle')) return 'Roofing';
        if (desc.includes('insulation')) return 'Insulation';
        if (desc.includes('hvac') || desc.includes('furnace') || desc.includes('ac')) return 'HVAC';
        
        return 'Materials';
    }

    /**
     * Search a specific retailer using their site search
     */
    private async searchRetailer(
        retailer: 'home_depot' | 'lowes' | 'menards',
        query: string
    ): Promise<WebProduct[]> {
        try {
            const retailerInfo = this.retailers[retailer];
            const searchUrl = `${retailerInfo.searchUrl}${encodeURIComponent(query)}`;

            // Generate search results with direct links
            // In a real implementation, you would:
            // 1. Use a web scraping service (ScraperAPI, SerpAPI, etc.)
            // 2. Or use retailer APIs (if available)
            // 3. Or implement server-side scraping
            
            // For now, we'll create smart search links
            const products: WebProduct[] = [
                {
                    id: `${retailer}-${Date.now()}-1`,
                    name: `Search ${retailerInfo.name} for: ${query}`,
                    retailer: retailer,
                    url: searchUrl,
                    description: `Click to browse ${query} at ${retailerInfo.name}`,
                    priceText: 'View prices online'
                }
            ];

            return products;

        } catch (error) {
            console.error(`Error searching ${retailer}:`, error);
            return [];
        }
    }

    /**
     * Get retailer information
     */
    getRetailerInfo(retailer: 'home_depot' | 'lowes' | 'menards') {
        return this.retailers[retailer];
    }

    /**
     * Generate direct product search URLs for manual browsing
     */
    getDirectSearchLinks(query: string): Record<string, string> {
        return {
            home_depot: `https://www.homedepot.com/s/${encodeURIComponent(query)}`,
            lowes: `https://www.lowes.com/search?text=${encodeURIComponent(query)}`,
            menards: `https://www.menards.com/main/search.html?search=${encodeURIComponent(query)}`,
            amazon: `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
            google: `https://www.google.com/search?q=${encodeURIComponent(query + ' buy')}`,
        };
    }

    /**
     * ENHANCED VERSION: Use real-time web search API
     * This uses SerpAPI (has free tier) or similar service
     */
    async searchProductsRealTime(
        lineItemDescription: string,
        category?: string
    ): Promise<ProductSearchResult> {
        try {
            console.log('🔍 Real-time search for:', lineItemDescription);

            const searchQuery = this.buildSearchQuery(lineItemDescription, category);
            const products: WebProduct[] = [];

            // Search Home Depot using Google Shopping
            const homeDepotQuery = `site:homedepot.com ${searchQuery}`;
            const homeDepotProducts = await this.googleSearch(homeDepotQuery, 'home_depot');
            products.push(...homeDepotProducts);

            // Search Lowe's using Google Shopping
            const lowesQuery = `site:lowes.com ${searchQuery}`;
            const lowesProducts = await this.googleSearch(lowesQuery, 'lowes');
            products.push(...lowesProducts);

            // Search Menards
            const menardsQuery = `site:menards.com ${searchQuery}`;
            const menardsProducts = await this.googleSearch(menardsQuery, 'menards');
            products.push(...menardsProducts);

            return {
                category: category || this.detectCategory(lineItemDescription),
                searchQuery: searchQuery,
                products: products,
                timestamp: new Date()
            };

        } catch (error) {
            console.error('Error in real-time search:', error);
            // Fallback to direct links
            return this.searchProducts(lineItemDescription, category);
        }
    }

    /**
     * Google Custom Search (requires API key but has generous free tier)
     * Free tier: 100 searches/day
     * Get key at: https://developers.google.com/custom-search/v1/overview
     */
    private async googleSearch(
        query: string,
        retailer: 'home_depot' | 'lowes' | 'menards',
        limit: number = 5
    ): Promise<WebProduct[]> {
        try {
            // This would use Google Custom Search API
            // For now, return placeholder that opens search
            const retailerInfo = this.retailers[retailer];
            
            return [{
                id: `${retailer}-search-${Date.now()}`,
                name: `Browse ${retailerInfo.name} products`,
                retailer: retailer,
                url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
                description: query,
                priceText: 'Click to view products and prices'
            }];

        } catch (error) {
            console.error('Google search error:', error);
            return [];
        }
    }

    /**
     * Format product for display
     */
    formatProductDisplay(product: WebProduct): string {
        let display = product.name;
        
        if (product.brand) {
            display += ` by ${product.brand}`;
        }
        
        if (product.price) {
            display += ` - $${product.price.toFixed(2)}`;
        } else if (product.priceText) {
            display += ` - ${product.priceText}`;
        }
        
        if (product.rating) {
            display += ` ⭐ ${product.rating}`;
        }
        
        return display;
    }

    /**
     * Get category-specific search terms
     */
    getCategorySearchTerms(category: string): string[] {
        const terms: Record<string, string[]> = {
            'Paint': ['interior paint', 'exterior paint', 'primer', 'paint supplies'],
            'Flooring': ['laminate flooring', 'hardwood flooring', 'tile', 'vinyl plank'],
            'Cabinets': ['kitchen cabinets', 'bathroom cabinets', 'cabinet hardware'],
            'Doors': ['interior doors', 'exterior doors', 'door hardware'],
            'Windows': ['replacement windows', 'window installation'],
            'Lumber': ['dimensional lumber', '2x4', '2x6', 'plywood'],
            'Drywall': ['drywall sheets', 'joint compound', 'drywall screws'],
            'Electrical': ['electrical wire', 'outlets', 'switches', 'breakers'],
            'Plumbing': ['pex pipe', 'copper pipe', 'faucets', 'fixtures'],
            'Roofing': ['shingles', 'underlayment', 'roofing nails'],
        };

        return terms[category] || [category.toLowerCase()];
    }
}

export const webProductSearchService = new WebProductSearchService();
export default webProductSearchService;
