// Deno Edge Function: fetch-estimate-products
// Fetches products for ALL line items in an estimate at once

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface EstimateItem {
    description: string;
    quantity?: number;
    unit?: string;
}

interface EstimateProductsRequest {
    items: EstimateItem[];
    projectType: string;
}

serve(async (req) => {
    try {
        const { items, projectType }: EstimateProductsRequest = await req.json();

        // Build comprehensive prompt for all items
        const itemsList = items.map((item, idx) => 
            `${idx + 1}. ${item.description} (${item.quantity || 'TBD'} ${item.unit || ''})`
        ).join('\n');

        const prompt = `
You are a construction materials expert. Analyze these line items from a ${projectType} project and suggest products for each.

Line Items:
${itemsList}

For EACH line item, provide product suggestions in Budget, Mid-Grade, and Premium tiers from Home Depot, Lowe's, and Menards.

Return a JSON object with:
{
    "categories": [
        {
            "category": "Category name",
            "description": "What's needed",
            "quantity": 0,
            "unit": "unit",
            "suggestions": {
                "budget": [{ product details }],
                "mid": [{ product details }],
                "high": [{ product details }]
            }
        }
    ]
}

Each product should have: name, brand, sku, retailer (home_depot/lowes/menards), price, unit, rating, review_count, in_stock, url, image_url.

Use REAL products that are currently available at these retailers with accurate pricing.
`;

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
                        content: 'You are a construction materials expert with knowledge of Home Depot, Lowe\'s, and Menards inventory and pricing.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.7,
                max_tokens: 4000
            })
        });

        if (!openaiResponse.ok) {
            throw new Error(`OpenAI API error: ${await openaiResponse.text()}`);
        }

        const openaiData = await openaiResponse.json();
        const result = JSON.parse(openaiData.choices[0].message.content);

        // Add IDs and metadata to all products
        result.categories.forEach((cat: any) => {
            ['budget', 'mid', 'high'].forEach(grade => {
                if (cat.suggestions[grade]) {
                    cat.suggestions[grade] = cat.suggestions[grade].map((p: any) => ({
                        ...p,
                        id: p.sku || `${p.name.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
                        grade: grade,
                        category: cat.category,
                        description: p.description || ''
                    }));
                }
            });
        });

        return new Response(
            JSON.stringify(result),
            { 
                headers: { 'Content-Type': 'application/json' },
                status: 200 
            }
        );

    } catch (error: any) {
        console.error('Error fetching estimate products:', error);
        return new Response(
            JSON.stringify({ 
                error: error.message,
                categories: []
            }),
            { 
                headers: { 'Content-Type': 'application/json' },
                status: 500 
            }
        );
    }
});
