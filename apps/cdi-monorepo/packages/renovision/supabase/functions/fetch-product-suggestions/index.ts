import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface ProductRequest {
    description: string;
    projectType: string;
    quantity?: number;
    unit?: string;
}

serve(async (req) => {
    try {
        const { description, projectType, quantity, unit }: ProductRequest = await req.json();

        // Use OpenAI to analyze the line item and determine product categories
        const analysisPrompt = `
You are a construction materials expert. Analyze this line item from a construction estimate and suggest appropriate products.

Line Item: "${description}"
Project Type: "${projectType}"
Quantity: ${quantity || 'TBD'} ${unit || ''}

Task: Identify the material categories needed for this line item and suggest specific popular products from Home Depot, Lowe's, and Menards.

For each category, provide:
1. Budget-friendly option (good quality, lowest price)
2. Mid-grade option (balance of quality and price)
3. Premium option (best quality, higher price)

Return a JSON object with this structure:
{
    "category": "Main category name (e.g., 'Paint', 'Flooring', 'Cabinets')",
    "description": "Brief description of what's needed",
    "quantity": ${quantity || 1},
    "unit": "${unit || 'each'}",
    "suggestions": {
        "budget": [
            {
                "name": "Exact product name",
                "brand": "Brand name",
                "sku": "Product SKU/model",
                "retailer": "home_depot|lowes|menards",
                "price": 0.00,
                "unit": "each|sqft|box|gallon",
                "rating": 4.5,
                "review_count": 1000,
                "in_stock": true,
                "url": "Product URL",
                "image_url": "Product image URL"
            }
        ],
        "mid": [...],
        "high": [...]
    }
}

Use real, current products that are actually sold at these retailers. Include at least 2-3 options per grade from different retailers.
`;

        // Call OpenAI API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a construction materials expert with extensive knowledge of products sold at Home Depot, Lowe\'s, and Menards. Provide accurate product information including current pricing and availability.'
                    },
                    {
                        role: 'user',
                        content: analysisPrompt
                    }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!openaiResponse.ok) {
            const error = await openaiResponse.text();
            throw new Error(`OpenAI API error: ${error}`);
        }

        const openaiData = await openaiResponse.json();
        const productData = JSON.parse(openaiData.choices[0].message.content);

        // Add IDs to products
        if (productData.suggestions) {
            ['budget', 'mid', 'high'].forEach(grade => {
                if (productData.suggestions[grade]) {
                    productData.suggestions[grade] = productData.suggestions[grade].map((p: any) => ({
                        ...p,
                        id: p.sku || `${p.name.toLowerCase().replace(/\s/g, '-')}-${Math.random().toString(36).substr(2, 9)}`,
                        grade: grade,
                        category: productData.category,
                        description: p.description || ''
                    }));
                }
            });
        }

        // Cache the results
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
        
        // Store in cache for 7 days
        for (const grade of ['budget', 'mid', 'high']) {
            for (const product of productData.suggestions[grade] || []) {
                await supabase.from('product_suggestions_cache').insert({
                    search_query: description,
                    category: productData.category,
                    grade: grade,
                    retailer: product.retailer,
                    product_data: product
                });
            }
        }

        return new Response(
            JSON.stringify(productData),
            { 
                headers: { 'Content-Type': 'application/json' },
                status: 200 
            }
        );

    } catch (error: any) {
        console.error('Error fetching product suggestions:', error);
        return new Response(
            JSON.stringify({ 
                error: error.message,
                category: 'Unknown',
                description: 'Error fetching products',
                quantity: 0,
                unit: 'each',
                suggestions: {
                    budget: [],
                    mid: [],
                    high: []
                }
            }),
            { 
                headers: { 'Content-Type': 'application/json' },
                status: 500 
            }
        );
    }
});
