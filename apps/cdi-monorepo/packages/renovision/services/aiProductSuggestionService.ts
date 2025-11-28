import { supabase } from '../supabase';

interface ProductSuggestion {
    productName: string;
    brand: string;
    model?: string;
    url: string;
    price?: number;
    imageUrl?: string;
    description: string;
    rating?: number;
    reviewCount?: number;
    contractorPreferred: boolean;
    aiReasoning: string;
}

interface ProductSearchResult {
    suggestions: ProductSuggestion[];
    fromCache: boolean;
    searchQuery: string;
}

export class AIProductSuggestionService {
    
    /**
     * Get AI-powered product suggestions for a line item
     */
    static async getProductSuggestions(
        lineItemDescription: string,
        category?: string,
        customPrompt?: string
    ): Promise<ProductSearchResult> {
        try {
            // Build search query
            const searchQuery = customPrompt || lineItemDescription;
            
            // Check cache first
            const cached = await this.getCachedProducts(searchQuery, category);
            if (cached) {
                console.log('✅ Using cached product suggestions');
                return {
                    suggestions: cached,
                    fromCache: true,
                    searchQuery
                };
            }

            // Not in cache - fetch from AI
            console.log('🤖 Fetching fresh product suggestions from AI...');
            const suggestions = await this.fetchProductsFromAI(searchQuery, category);

            // Cache the results
            await this.cacheProducts(searchQuery, category, suggestions);

            return {
                suggestions,
                fromCache: false,
                searchQuery
            };
        } catch (error) {
            console.error('Error getting product suggestions:', error);
            throw error;
        }
    }

    /**
     * Fetch products from AI using Gemini
     */
    private static async fetchProductsFromAI(
        searchQuery: string,
        category?: string,
        userApiKey?: string
    ): Promise<ProductSuggestion[]> {
        try {
            // Get user's API key - either passed in or fetch from profile
            let apiKey = userApiKey;
            
            if (!apiKey) {
                // Get current user's profile with their API key
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) {
                    throw new Error('User not authenticated');
                }
                
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('gemini_api_key')
                    .eq('id', user.id)
                    .single();
                
                if (!profile?.gemini_api_key) {
                    throw new Error('Please add your Gemini API key in Settings to use AI features');
                }
                
                apiKey = profile.gemini_api_key;
            }

            const prompt = `You are a construction materials expert helping contractors find the best products.

TASK: Find the top 3 contractor-grade products for: "${searchQuery}"
${category ? `Category: ${category}` : ''}

REQUIREMENTS:
1. Focus on CONTRACTOR-GRADE products (professional use, durable, reliable)
2. Prioritize products from: Home Depot, Lowe's, Menards, Ferguson
3. Include actual product links (use real URLs like homedepot.com, lowes.com)
4. Show current pricing if available
5. Rank by popularity among contractors

RESPOND IN THIS EXACT JSON FORMAT:
{
  "products": [
    {
      "productName": "Product Name with Model Number",
      "brand": "Brand Name",
      "model": "Model #",
      "url": "https://www.homedepot.com/p/...",
      "price": 99.99,
      "imageUrl": "https://image-url.jpg",
      "description": "Brief description focusing on contractor benefits",
      "rating": 4.5,
      "reviewCount": 234,
      "contractorPreferred": true,
      "aiReasoning": "Why this is the #1 choice for contractors"
    }
  ]
}

IMPORTANT:
- Use REAL product URLs from major retailers
- Price in USD (number only, no $ sign)
- Rating out of 5 (decimal)
- Make sure URLs are clickable links to actual products
- Prioritize in-stock, readily available products
`;

            // Call Gemini API (using v1beta with gemini-pro - most compatible)
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 2048,
                        }
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.statusText}`);
            }

            const data = await response.json();
            const aiResponse = data.candidates[0]?.content?.parts[0]?.text;

            if (!aiResponse) {
                throw new Error('No response from Gemini');
            }

            // Parse JSON from AI response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Could not parse JSON from AI response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.products || [];

        } catch (error) {
            console.error('Error fetching from AI:', error);
            throw error;
        }
    }

    /**
     * Get cached products if available and not expired
     */
    private static async getCachedProducts(
        searchQuery: string,
        category?: string
    ): Promise<ProductSuggestion[] | null> {
        try {
            const { data, error } = await supabase.rpc('get_cached_products', {
                p_search_query: searchQuery,
                p_category: category || null,
                p_contractor_grade: true
            });

            if (error) throw error;
            
            return data ? (data as any).products : null;
        } catch (error) {
            console.error('Error getting cached products:', error);
            return null;
        }
    }

    /**
     * Cache product search results
     */
    private static async cacheProducts(
        searchQuery: string,
        category: string | undefined,
        products: ProductSuggestion[]
    ): Promise<void> {
        try {
            await supabase
                .from('product_search_cache')
                .insert({
                    search_query: searchQuery,
                    category: category || null,
                    contractor_grade: true,
                    products: products,
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                });
        } catch (error) {
            console.error('Error caching products:', error);
            // Non-critical error, don't throw
        }
    }

    /**
     * Save product suggestion to estimate
     */
    static async saveProductSuggestion(
        estimateId: string,
        lineItemIndex: number,
        lineItemDescription: string,
        product: ProductSuggestion,
        searchQuery: string,
        popularityRank: number
    ): Promise<string> {
        try {
            const { data, error } = await supabase
                .from('product_suggestions')
                .insert({
                    estimate_id: estimateId,
                    line_item_index: lineItemIndex,
                    line_item_description: lineItemDescription,
                    search_query: searchQuery,
                    product_name: product.productName,
                    product_brand: product.brand,
                    product_model: product.model || null,
                    product_url: product.url,
                    product_price: product.price || null,
                    product_image_url: product.imageUrl || null,
                    product_description: product.description,
                    popularity_rank: popularityRank,
                    rating: product.rating || null,
                    review_count: product.reviewCount || null,
                    contractor_preferred: product.contractorPreferred,
                    ai_reasoning: product.aiReasoning
                })
                .select('id')
                .single();

            if (error) throw error;
            return data.id;
        } catch (error) {
            console.error('Error saving product suggestion:', error);
            throw error;
        }
    }

    /**
     * Accept a product suggestion
     */
    static async acceptProduct(suggestionId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('product_suggestions')
                .update({
                    accepted: true,
                    accepted_at: new Date().toISOString()
                })
                .eq('id', suggestionId);

            if (error) throw error;
        } catch (error) {
            console.error('Error accepting product:', error);
            throw error;
        }
    }

    /**
     * Reject a product and request alternative
     */
    static async rejectAndRequestAlternative(
        suggestionId: string,
        reason?: string
    ): Promise<void> {
        try {
            const { error } = await supabase
                .from('product_suggestions')
                .update({
                    rejected: true,
                    rejection_reason: reason || 'User requested alternative',
                    alternative_requested: true
                })
                .eq('id', suggestionId);

            if (error) throw error;
        } catch (error) {
            console.error('Error rejecting product:', error);
            throw error;
        }
    }

    /**
     * Get suggestions for an estimate line item
     */
    static async getSuggestionsForLineItem(
        estimateId: string,
        lineItemIndex: number
    ): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('product_suggestions')
                .select('*')
                .eq('estimate_id', estimateId)
                .eq('line_item_index', lineItemIndex)
                .order('popularity_rank', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting line item suggestions:', error);
            return [];
        }
    }

    /**
     * Clear cache (for admin/maintenance)
     */
    static async clearExpiredCache(): Promise<number> {
        try {
            const { data, error } = await supabase.rpc('cleanup_expired_product_cache');
            if (error) throw error;
            return data || 0;
        } catch (error) {
            console.error('Error clearing cache:', error);
            return 0;
        }
    }
}

export default AIProductSuggestionService;
