/**
 * Material Fulfillment Service
 * 
 * Handles the complete material procurement workflow:
 * 1. Client approves estimate with retail pricing
 * 2. Client pays Constructive Designs (nonprofit) directly
 * 3. System creates purchase orders for retailers
 * 4. Nonprofit purchases materials tax-exempt with discounts
 * 5. Materials delivered to job site
 * 6. Margin (tax savings + discounts) retained for operating capital
 * 
 * FINANCIAL MODEL:
 * - Client pays retail price + tax
 * - Nonprofit purchases tax-exempt + contractor discount (10-20%)
 * - Margin retained: ~15-25% per project
 * - Builds cash reserves for future material purchases
 * - Creates sustainable operating model
 */

import { supabase } from '../supabase';
import { Product } from './productScraperService';

export interface MaterialOrder {
    id: string;
    estimateId: string;
    projectId: string;
    businessId: string;
    status: 'pending-payment' | 'paid' | 'purchasing' | 'ordered' | 'shipped' | 'delivered' | 'cancelled';
    
    // Client-facing pricing (retail + tax)
    clientTotal: number;
    clientTaxAmount: number;
    clientGrandTotal: number;
    
    // Actual purchase cost (tax-exempt + discounts)
    purchaseCost: number;
    estimatedSavings: number;
    actualSavings?: number;
    
    // Payment info
    paymentIntentId?: string;
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    paidAt?: Date;
    
    // Fulfillment info
    purchaseOrders: PurchaseOrder[];
    deliveryAddress: string;
    requestedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    
    notes: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface PurchaseOrder {
    id: string;
    retailer: 'homedepot' | 'lowes' | 'menards';
    items: OrderItem[];
    
    // Pricing
    subtotal: number;
    taxAmount: number; // Should be $0 for nonprofit
    discountAmount: number; // Contractor/pro discount
    total: number;
    
    // Status
    status: 'draft' | 'submitted' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    orderNumber?: string; // Retailer's order number
    trackingNumber?: string;
    
    // Nonprofit credentials used
    taxExemptCertNumber: string;
    proAccountNumber?: string;
    
    submittedAt?: Date;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
}

export interface OrderItem {
    product: Product;
    quantity: number;
    
    // Client-facing price
    clientUnitPrice: number;
    clientTotal: number;
    
    // Actual purchase price
    purchaseUnitPrice: number;
    purchaseTotal: number;
    
    // Savings breakdown
    taxSavings: number;
    discountSavings: number;
    totalSavings: number;
}

/**
 * Calculate pricing for material order
 * Shows client retail + tax, calculates actual cost with exemptions/discounts
 */
export function calculateMaterialPricing(
    products: { product: Product; quantity: number }[],
    localTaxRate: number,
    contractorDiscountRate: number = 0.15 // 15% average contractor discount
): {
    clientTotal: number;
    clientTaxAmount: number;
    clientGrandTotal: number;
    purchaseCost: number;
    estimatedSavings: number;
    savingsBreakdown: {
        taxSavings: number;
        discountSavings: number;
    };
} {
    let clientTotal = 0;
    let purchaseCost = 0;
    let taxSavings = 0;
    let discountSavings = 0;
    
    for (const { product, quantity } of products) {
        const retailPrice = product.price * quantity;
        clientTotal += retailPrice;
        
        // Calculate actual purchase price
        const discountedPrice = retailPrice * (1 - contractorDiscountRate);
        purchaseCost += discountedPrice;
        
        // Track savings
        discountSavings += (retailPrice - discountedPrice);
    }
    
    // Client pays tax, nonprofit doesn't
    const clientTaxAmount = clientTotal * localTaxRate;
    taxSavings = clientTaxAmount;
    
    const clientGrandTotal = clientTotal + clientTaxAmount;
    const estimatedSavings = taxSavings + discountSavings;
    
    return {
        clientTotal,
        clientTaxAmount,
        clientGrandTotal,
        purchaseCost,
        estimatedSavings,
        savingsBreakdown: {
            taxSavings,
            discountSavings
        }
    };
}

/**
 * Create material order after client approves estimate
 */
export async function createMaterialOrder(
    estimateId: string,
    projectId: string,
    businessId: string,
    products: { product: Product; quantity: number }[],
    deliveryAddress: string,
    localTaxRate: number
): Promise<MaterialOrder> {
    const pricing = calculateMaterialPricing(products, localTaxRate);
    
    // Group products by retailer for purchase orders
    const retailerGroups = products.reduce((groups, item) => {
        const retailer = item.product.retailer;
        if (!groups[retailer]) {
            groups[retailer] = [];
        }
        groups[retailer].push(item);
        return groups;
    }, {} as Record<string, typeof products>);
    
    // Create purchase orders for each retailer
    const purchaseOrders: PurchaseOrder[] = Object.entries(retailerGroups).map(
        ([retailer, items]) => createPurchaseOrder(retailer as any, items, localTaxRate)
    );
    
    const order: MaterialOrder = {
        id: crypto.randomUUID(),
        estimateId,
        projectId,
        businessId,
        status: 'pending-payment',
        clientTotal: pricing.clientTotal,
        clientTaxAmount: pricing.clientTaxAmount,
        clientGrandTotal: pricing.clientGrandTotal,
        purchaseCost: pricing.purchaseCost,
        estimatedSavings: pricing.estimatedSavings,
        paymentStatus: 'pending',
        purchaseOrders,
        deliveryAddress,
        notes: [
            'Client pays retail price + tax',
            'Nonprofit purchases tax-exempt',
            `Estimated savings: $${pricing.estimatedSavings.toFixed(2)}`,
            'Savings retained for operating capital'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    // Save to database
    await saveMaterialOrder(order);
    
    return order;
}

/**
 * Create purchase order for a specific retailer
 */
function createPurchaseOrder(
    retailer: 'homedepot' | 'lowes' | 'menards',
    items: { product: Product; quantity: number }[],
    localTaxRate: number
): PurchaseOrder {
    const orderItems: OrderItem[] = items.map(({ product, quantity }) => {
        const clientUnitPrice = product.price;
        const clientTotal = clientUnitPrice * quantity;
        
        // Apply contractor discount (typically 10-20%)
        const discountRate = getContractorDiscountRate(retailer);
        const purchaseUnitPrice = clientUnitPrice * (1 - discountRate);
        const purchaseTotal = purchaseUnitPrice * quantity;
        
        const taxSavings = clientTotal * localTaxRate;
        const discountSavings = clientTotal - purchaseTotal;
        
        return {
            product,
            quantity,
            clientUnitPrice,
            clientTotal,
            purchaseUnitPrice,
            purchaseTotal,
            taxSavings,
            discountSavings,
            totalSavings: taxSavings + discountSavings
        };
    });
    
    const subtotal = orderItems.reduce((sum, item) => sum + item.purchaseTotal, 0);
    const taxAmount = 0; // Tax-exempt
    const discountAmount = orderItems.reduce((sum, item) => sum + item.discountSavings, 0);
    
    return {
        id: crypto.randomUUID(),
        retailer,
        items: orderItems,
        subtotal,
        taxAmount,
        discountAmount,
        total: subtotal + taxAmount,
        status: 'draft',
        taxExemptCertNumber: getNonprofitTaxExemptNumber(),
        proAccountNumber: getProAccountNumber(retailer)
    };
}

/**
 * Process client payment through Stripe
 */
export async function processClientPayment(
    orderId: string,
    paymentMethodId: string,
    clientEmail: string
): Promise<{ success: boolean; paymentIntentId?: string; error?: string }> {
    try {
        // In production, integrate with Stripe
        // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        
        const order = await getMaterialOrder(orderId);
        
        if (!order) {
            return { success: false, error: 'Order not found' };
        }
        
        // Create Stripe payment intent
        /*
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(order.clientGrandTotal * 100), // Convert to cents
            currency: 'usd',
            payment_method: paymentMethodId,
            customer_email: clientEmail,
            metadata: {
                orderId: order.id,
                estimateId: order.estimateId,
                projectId: order.projectId,
                type: 'material_order'
            },
            description: `Material order for project ${order.projectId}`,
            confirm: true
        });
        */
        
        // Mock success for now
        const paymentIntentId = 'pi_mock_' + Date.now();
        
        // Update order
        await updateMaterialOrder(orderId, {
            paymentIntentId,
            paymentStatus: 'completed',
            paidAt: new Date(),
            status: 'paid'
        });
        
        // Trigger purchase workflow
        await initiateMaterialPurchase(orderId);
        
        return { success: true, paymentIntentId };
        
    } catch (error) {
        console.error('Payment processing error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Payment failed'
        };
    }
}

/**
 * Initiate material purchase after payment received
 * Creates purchase orders at retailers
 */
async function initiateMaterialPurchase(orderId: string): Promise<void> {
    const order = await getMaterialOrder(orderId);
    
    if (!order || order.paymentStatus !== 'completed') {
        throw new Error('Cannot purchase: payment not completed');
    }
    
    await updateMaterialOrder(orderId, { status: 'purchasing' });
    
    // Submit purchase orders to each retailer
    for (const po of order.purchaseOrders) {
        try {
            await submitPurchaseOrder(po, order);
        } catch (error) {
            console.error(`Failed to submit PO to ${po.retailer}:`, error);
            // Continue with other retailers
        }
    }
    
    await updateMaterialOrder(orderId, { status: 'ordered' });
}

/**
 * Submit purchase order to retailer
 * In production, this would use retailer APIs or web automation
 */
async function submitPurchaseOrder(
    po: PurchaseOrder,
    order: MaterialOrder
): Promise<void> {
    console.log(`📦 Submitting order to ${po.retailer}...`);
    
    // In production, implement one of these approaches:
    
    // 1. API Integration (preferred)
    /*
    if (po.retailer === 'homedepot') {
        const response = await fetch('https://api.homedepot.com/v1/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HD_PRO_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                account: po.proAccountNumber,
                taxExemptCert: po.taxExemptCertNumber,
                items: po.items.map(item => ({
                    sku: item.product.sku,
                    quantity: item.quantity
                })),
                deliveryAddress: order.deliveryAddress,
                requestedDelivery: order.requestedDeliveryDate
            })
        });
        
        const result = await response.json();
        po.orderNumber = result.orderNumber;
        po.trackingNumber = result.trackingNumber;
    }
    */
    
    // 2. Web Automation (Puppeteer/Playwright)
    /*
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Login to pro account
    await page.goto(`https://www.${po.retailer}.com/pro/login`);
    await page.type('#username', process.env.HD_PRO_USERNAME);
    await page.type('#password', process.env.HD_PRO_PASSWORD);
    await page.click('#login-button');
    
    // Add items to cart
    for (const item of po.items) {
        await page.goto(item.product.productUrl);
        await page.type('#quantity', item.quantity.toString());
        await page.click('#add-to-cart');
    }
    
    // Checkout with tax-exempt cert
    await page.goto('/checkout');
    await page.check('#tax-exempt');
    await page.type('#cert-number', po.taxExemptCertNumber);
    await page.type('#delivery-address', order.deliveryAddress);
    await page.click('#submit-order');
    
    // Get order confirmation
    await page.waitForSelector('.order-number');
    po.orderNumber = await page.$eval('.order-number', el => el.textContent);
    
    await browser.close();
    */
    
    // Mock for now
    po.status = 'submitted';
    po.orderNumber = `${po.retailer.toUpperCase()}-${Date.now()}`;
    po.submittedAt = new Date();
    po.estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
    
    console.log(`✅ Order submitted: ${po.orderNumber}`);
}

/**
 * Helper functions
 */

function getContractorDiscountRate(retailer: string): number {
    // Typical contractor/pro discounts
    const rates = {
        homedepot: 0.15, // 15% Pro Xtra discount
        lowes: 0.10,     // 10% Pro discount
        menards: 0.20    // 20% contractor discount
    };
    return rates[retailer as keyof typeof rates] || 0.10;
}

function getNonprofitTaxExemptNumber(): string {
    // Replace with actual 501(c)(3) tax-exempt certificate number
    return process.env.NONPROFIT_TAX_EXEMPT_CERT || 'EX-123456789';
}

function getProAccountNumber(retailer: string): string | undefined {
    // Replace with actual pro account numbers
    const accounts = {
        homedepot: process.env.HD_PRO_ACCOUNT,
        lowes: process.env.LOWES_PRO_ACCOUNT,
        menards: process.env.MENARDS_PRO_ACCOUNT
    };
    return accounts[retailer as keyof typeof accounts];
}

/**
 * Database operations
 */

async function saveMaterialOrder(order: MaterialOrder): Promise<void> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { error } = await supabase
        .from('material_orders')
        .insert({
            id: order.id,
            estimate_id: order.estimateId,
            project_id: order.projectId,
            business_id: order.businessId,
            status: order.status,
            client_total: order.clientTotal,
            client_tax_amount: order.clientTaxAmount,
            client_grand_total: order.clientGrandTotal,
            purchase_cost: order.purchaseCost,
            estimated_savings: order.estimatedSavings,
            payment_status: order.paymentStatus,
            purchase_orders: order.purchaseOrders,
            delivery_address: order.deliveryAddress,
            notes: order.notes,
            created_at: order.createdAt,
            updated_at: order.updatedAt
        });
    
    if (error) throw error;
}

async function getMaterialOrder(orderId: string): Promise<MaterialOrder | null> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
        .from('material_orders')
        .select('*')
        .eq('id', orderId)
        .single();
    
    if (error) {
        console.error('Error fetching order:', error);
        return null;
    }
    
    return transformMaterialOrder(data);
}

async function updateMaterialOrder(
    orderId: string,
    updates: Partial<MaterialOrder>
): Promise<void> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { error } = await supabase
        .from('material_orders')
        .update({
            ...updates,
            updated_at: new Date()
        })
        .eq('id', orderId);
    
    if (error) throw error;
}

function transformMaterialOrder(data: any): MaterialOrder {
    return {
        id: data.id,
        estimateId: data.estimate_id,
        projectId: data.project_id,
        businessId: data.business_id,
        status: data.status,
        clientTotal: data.client_total,
        clientTaxAmount: data.client_tax_amount,
        clientGrandTotal: data.client_grand_total,
        purchaseCost: data.purchase_cost,
        estimatedSavings: data.estimated_savings,
        actualSavings: data.actual_savings,
        paymentIntentId: data.payment_intent_id,
        paymentStatus: data.payment_status,
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
        purchaseOrders: data.purchase_orders,
        deliveryAddress: data.delivery_address,
        requestedDeliveryDate: data.requested_delivery_date ? new Date(data.requested_delivery_date) : undefined,
        actualDeliveryDate: data.actual_delivery_date ? new Date(data.actual_delivery_date) : undefined,
        notes: data.notes,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
    };
}

/**
 * IMPLEMENTATION CHECKLIST:
 * 
 * 1. SET UP NONPROFIT ACCOUNTS:
 *    ✓ Register 501(c)(3) with IRS
 *    ✓ Obtain tax-exempt certificate
 *    ✓ Apply for Home Depot Pro Xtra (15% discount)
 *    ✓ Apply for Lowe's MVP Pro (10% discount)
 *    ✓ Apply for Menards Contractor Program (20% discount)
 * 
 * 2. SET UP PAYMENT PROCESSING:
 *    ✓ Stripe account for payment processing
 *    ✓ Configure as nonprofit (lower fees: 2.2% + $0.30)
 *    ✓ Set up webhooks for payment confirmation
 *    ✓ Implement refund handling
 * 
 * 3. CREATE DATABASE SCHEMA:
 *    ✓ material_orders table
 *    ✓ purchase_orders table
 *    ✓ order_tracking table
 * 
 * 4. RETAILER INTEGRATION:
 *    ✓ API keys for Home Depot, Lowe's, Menards
 *    ✓ Web automation for retailers without APIs
 *    ✓ Order confirmation webhooks
 *    ✓ Tracking number integration
 * 
 * 5. FINANCIAL TRACKING:
 *    ✓ Revenue recognition (client payment)
 *    ✓ Cost tracking (actual purchases)
 *    ✓ Margin calculation and reporting
 *    ✓ Operating capital fund management
 * 
 * 6. COMPLIANCE:
 *    ✓ Store tax-exempt certificates securely
 *    ✓ Maintain purchase records (IRS requirement)
 *    ✓ Financial reporting for nonprofit status
 *    ✓ Audit trail for all transactions
 */
