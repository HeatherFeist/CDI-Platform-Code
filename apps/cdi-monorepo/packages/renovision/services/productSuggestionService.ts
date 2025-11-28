import { supabase } from '../supabase';

export interface ProductSuggestion {
    id: string;
    name: string;
    brand: string;
    description: string;
    price: number;
    unit: string; // 'each', 'sqft', 'linear_ft', 'box', 'gallon', etc.
    retailer: 'home_depot' | 'lowes' | 'menards';
    sku: string;
    url: string;
    image_url: string;
    grade: 'budget' | 'mid' | 'high';
    category: string;
    rating?: number;
    review_count?: number;
    in_stock: boolean;
    specifications?: Record<string, any>;
}

export interface ProductCategory {
    category: string;
    description: string;
    quantity: number;
    unit: string;
    suggestions: {
        budget: ProductSuggestion[];
        mid: ProductSuggestion[];
        high: ProductSuggestion[];
    };
}

export interface MaterialsCalculation {
    categories: ProductCategory[];
    selectedProducts: Map<string, ProductSuggestion>; // category -> selected product
    totalCost: number;
    breakdown: {
        category: string;
        product: ProductSuggestion;
        quantity: number;
        subtotal: number;
    }[];
}

class ProductSuggestionService {
    /**
     * Fetch product suggestions from major retailers using AI
     */
    async fetchProductSuggestions(
        lineItemDescription: string,
        projectType: string,
        estimatedQuantity?: number,
        unit?: string
    ): Promise<ProductCategory | null> {
        try {
            // Call AI agent to analyze the line item and fetch suitable products
            const { data, error } = await supabase.functions.invoke('fetch-product-suggestions', {
                body: {
                    description: lineItemDescription,
                    projectType: projectType,
                    quantity: estimatedQuantity,
                    unit: unit
                }
            });

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error fetching product suggestions:', error);
            return null;
        }
    }

    /**
     * Fetch products for entire estimate at once
     */
    async fetchEstimateProducts(
        estimateItems: Array<{
            description: string;
            quantity?: number;
            unit?: string;
        }>,
        projectType: string
    ): Promise<ProductCategory[]> {
        try {
            const { data, error } = await supabase.functions.invoke('fetch-estimate-products', {
                body: {
                    items: estimateItems,
                    projectType: projectType
                }
            });

            if (error) throw error;

            return data.categories || [];
        } catch (error) {
            console.error('Error fetching estimate products:', error);
            return [];
        }
    }

    /**
     * Search specific product by keyword and retailer
     */
    async searchProduct(
        keyword: string,
        retailer?: 'home_depot' | 'lowes' | 'menards',
        grade?: 'budget' | 'mid' | 'high'
    ): Promise<ProductSuggestion[]> {
        try {
            const { data, error } = await supabase.functions.invoke('search-products', {
                body: {
                    keyword,
                    retailer,
                    grade
                }
            });

            if (error) throw error;

            return data.products || [];
        } catch (error) {
            console.error('Error searching products:', error);
            return [];
        }
    }

    /**
     * Calculate total materials cost based on selected products
     */
    calculateMaterialsCost(
        categories: ProductCategory[],
        selectedProducts: Map<string, ProductSuggestion>
    ): MaterialsCalculation {
        const breakdown: MaterialsCalculation['breakdown'] = [];
        let totalCost = 0;

        categories.forEach(category => {
            const selectedProduct = selectedProducts.get(category.category);
            if (selectedProduct) {
                const subtotal = selectedProduct.price * category.quantity;
                breakdown.push({
                    category: category.category,
                    product: selectedProduct,
                    quantity: category.quantity,
                    subtotal: subtotal
                });
                totalCost += subtotal;
            }
        });

        return {
            categories,
            selectedProducts,
            totalCost,
            breakdown
        };
    }

    /**
     * Save product selections to estimate
     */
    async saveProductSelections(
        estimateId: string,
        lineItemIndex: number,
        selectedProducts: {
            category: string;
            product: ProductSuggestion;
            quantity: number;
        }[]
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Save to estimate_materials table
            const materialsData = selectedProducts.map(item => ({
                estimate_id: estimateId,
                line_item_index: lineItemIndex,
                category: item.category,
                product_name: item.product.name,
                brand: item.product.brand,
                sku: item.product.sku,
                retailer: item.product.retailer,
                price_per_unit: item.product.price,
                quantity: item.quantity,
                unit: item.product.unit,
                total_cost: item.product.price * item.quantity,
                grade: item.product.grade,
                product_url: item.product.url,
                image_url: item.product.image_url,
                specifications: item.product.specifications
            }));

            const { error } = await supabase
                .from('estimate_materials')
                .upsert(materialsData, {
                    onConflict: 'estimate_id,line_item_index,category'
                });

            if (error) throw error;

            // Update estimate line item total
            const totalMaterialsCost = materialsData.reduce((sum, m) => sum + m.total_cost, 0);
            await this.updateLineItemMaterialsCost(estimateId, lineItemIndex, totalMaterialsCost);

            return { success: true };
        } catch (error: any) {
            console.error('Error saving product selections:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update line item with materials cost
     */
    private async updateLineItemMaterialsCost(
        estimateId: string,
        lineItemIndex: number,
        materialsCost: number
    ): Promise<void> {
        try {
            // Get current estimate
            const { data: estimate } = await supabase
                .from('estimates')
                .select('items')
                .eq('id', estimateId)
                .single();

            if (!estimate || !estimate.items) return;

            // Update the specific line item
            const updatedItems = [...estimate.items];
            if (updatedItems[lineItemIndex]) {
                updatedItems[lineItemIndex] = {
                    ...updatedItems[lineItemIndex],
                    materials_cost: materialsCost,
                    total: (updatedItems[lineItemIndex].labor_cost || 0) + materialsCost
                };

                // Save back to database
                await supabase
                    .from('estimates')
                    .update({ items: updatedItems })
                    .eq('id', estimateId);
            }
        } catch (error) {
            console.error('Error updating line item materials cost:', error);
        }
    }

    /**
     * Get saved product selections for estimate
     */
    async getProductSelections(
        estimateId: string,
        lineItemIndex?: number
    ): Promise<any[]> {
        try {
            let query = supabase
                .from('estimate_materials')
                .select('*')
                .eq('estimate_id', estimateId);

            if (lineItemIndex !== undefined) {
                query = query.eq('line_item_index', lineItemIndex);
            }

            const { data, error } = await query.order('category');

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error getting product selections:', error);
            return [];
        }
    }

    /**
     * Compare prices across retailers for same product category
     */
    async comparePrices(
        category: string,
        productType: string
    ): Promise<{
        budget: { homeDepot?: number; lowes?: number; menards?: number };
        mid: { homeDepot?: number; lowes?: number; menards?: number };
        high: { homeDepot?: number; lowes?: number; menards?: number };
    }> {
        try {
            const { data, error } = await supabase.functions.invoke('compare-prices', {
                body: { category, productType }
            });

            if (error) throw error;

            return data.comparison;
        } catch (error) {
            console.error('Error comparing prices:', error);
            return {
                budget: {},
                mid: {},
                high: {}
            };
        }
    }

    /**
     * Get popular products for a category (most used by contractors)
     */
    async getPopularProducts(
        category: string,
        grade: 'budget' | 'mid' | 'high',
        limit: number = 5
    ): Promise<ProductSuggestion[]> {
        try {
            const { data, error } = await supabase
                .from('estimate_materials')
                .select('product_name, brand, sku, retailer, price_per_unit, image_url, product_url, grade')
                .eq('category', category)
                .eq('grade', grade)
                .order('usage_count', { ascending: false })
                .limit(limit);

            if (error) throw error;

            // Transform to ProductSuggestion format
            return data?.map(item => ({
                id: item.sku,
                name: item.product_name,
                brand: item.brand,
                description: '',
                price: item.price_per_unit,
                unit: 'each',
                retailer: item.retailer,
                sku: item.sku,
                url: item.product_url,
                image_url: item.image_url,
                grade: item.grade,
                category: category,
                in_stock: true
            })) || [];
        } catch (error) {
            console.error('Error getting popular products:', error);
            return [];
        }
    }

    /**
     * Format product for display
     */
    formatProductDisplay(product: ProductSuggestion, quantity: number): string {
        const total = product.price * quantity;
        return `${product.name} by ${product.brand} - $${product.price.toFixed(2)}/${product.unit} × ${quantity} = $${total.toFixed(2)}`;
    }

    /**
     * Get retailer logo URL
     */
    getRetailerLogo(retailer: 'home_depot' | 'lowes' | 'menards'): string {
        const logos = {
            home_depot: 'https://corporate.homedepot.com/sites/default/files/image_gallery/THD_logo.jpg',
            lowes: 'https://corporate.lowes.com/sites/lowes-corp/files/2023-03/lowes-logo-2023.png',
            menards: 'https://www.menards.com/images/menards_logo.png'
        };
        return logos[retailer];
    }

    /**
     * Get grade badge color
     */
    getGradeBadgeColor(grade: 'budget' | 'mid' | 'high'): string {
        const colors = {
            budget: 'bg-green-100 text-green-800',
            mid: 'bg-blue-100 text-blue-800',
            high: 'bg-purple-100 text-purple-800'
        };
        return colors[grade];
    }

    /**
     * Get grade display name
     */
    getGradeDisplayName(grade: 'budget' | 'mid' | 'high'): string {
        const names = {
            budget: 'Budget',
            mid: 'Mid-Grade',
            high: 'Premium'
        };
        return names[grade];
    }
}

export const productSuggestionService = new ProductSuggestionService();
export default productSuggestionService;
