import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3002;

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Initialize Supabase service client for server-side writes (required to persist connected account ids)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
} else {
  console.warn('Supabase service role key not configured; connected accounts will not be persisted.');
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Payment server is running!' });
});

// Create Checkout Session endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { 
      listingId, 
      title, 
      price, 
      sellerId, 
      imageUrl,
      deliveryMethod,
      deliveryFee,
      deliveryDescription 
    } = req.body;

    // Validate required fields
    if (!listingId || !title || !price || !sellerId) {
      return res.status(400).json({ 
        error: 'Missing required fields: listingId, title, price, sellerId' 
      });
    }

    // Build line items array
    const lineItems = [];

    // Main item
    const itemPrice = deliveryFee ? price - deliveryFee : price;
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: title,
          images: imageUrl ? [imageUrl] : [],
          metadata: {
            listing_id: listingId,
            seller_id: sellerId,
          },
        },
        unit_amount: Math.round(itemPrice * 100), // Convert dollars to cents
      },
      quantity: 1,
    });

    // Add delivery fee as separate line item if present
    if (deliveryFee && deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: deliveryDescription || `Delivery Fee (${deliveryMethod})`,
            description: deliveryDescription,
          },
          unit_amount: Math.round(deliveryFee * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    // If the request includes `connectedAccountId` we create the session on behalf
    // of the connected account using the `stripeAccount` option.
    const sessionParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      
      // Success and cancel URLs
      success_url: `${process.env.VITE_PLATFORM_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_PLATFORM_URL || 'http://localhost:5173'}/cancel`,
      
      // Metadata for tracking
      metadata: {
        listing_id: listingId,
        seller_id: sellerId,
        delivery_method: deliveryMethod || 'none',
        delivery_fee: deliveryFee ? deliveryFee.toString() : '0',
        delivery_description: deliveryDescription || '',
      },
      
      // Collect shipping address (for delivery)
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      
      // Customer email collection
      customer_email: req.body.buyerEmail || undefined,
    };

    const connectedAccountId = req.body.connectedAccountId || req.body.sellerStripeAccountId;

    let session;
    if (connectedAccountId) {
      // Create session on behalf of connected account
      session = await stripe.checkout.sessions.create(sessionParams, { stripeAccount: connectedAccountId });
    } else {
      session = await stripe.checkout.sessions.create(sessionParams);
    }

    // Return session ID to frontend
    res.json({ 
      id: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create checkout session' 
    });
  }
});

// Stripe Connect: Redirect user to Stripe OAuth to connect their account
app.get('/api/stripe/connect', (req, res) => {
  const clientId = process.env.STRIPE_CLIENT_ID;
  if (!clientId) return res.status(500).send('Stripe client ID not configured');

  const state = req.query.state || '';
  const redirectUri = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&scope=read_write&state=${encodeURIComponent(state)}`;
  res.redirect(redirectUri);
});

// Stripe OAuth callback — exchanges code for connected account id and returns it.
app.get('/api/stripe/oauth/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('Missing code');

  try {
    const resp = await stripe.oauth.token({ grant_type: 'authorization_code', code });
    // resp contains connected_account id as stripe_user_id
    const connectedAccountId = resp.stripe_user_id;
    // Persist connected account id in Supabase (only store provider_account_id and metadata, not raw secrets)
    // Expect `state` to contain the owner_profile_id (supabase profile id) from the client
    if (supabase && state) {
      try {
        const ownerProfileId = state.toString();
        // Upsert into connected_accounts: only store provider_account_id and metadata. Do NOT store access tokens.
        const { data, error } = await supabase
          .from('connected_accounts')
          .upsert([
            {
              owner_profile_id: ownerProfileId,
              provider: 'stripe',
              provider_account_id: connectedAccountId,
              metadata: resp,
              updated_at: new Date().toISOString()
            }
          ], { onConflict: ['owner_profile_id', 'provider'] });

        if (error) console.error('Failed to persist connected account:', error);
      } catch (dbErr) {
        console.error('Error persisting connected account to Supabase:', dbErr);
      }
    }

    // Return a simple success page. Frontend should redirect the user back to settings/dashboard.
    res.send(`Connected! Account ID: ${connectedAccountId}. State: ${state}`);
  } catch (err) {
    console.error('Stripe OAuth error', err);
    res.status(500).send('Stripe OAuth failed');
  }
});

// Get Checkout Session details (for success page)
app.get('/api/checkout-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'line_items'],
    });

    res.json({
      id: session.id,
      amount: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      payment_method_type: session.payment_intent?.payment_method_types?.[0],
      customer_email: session.customer_email,
      customer_details: session.customer_details,
      shipping: session.shipping,
      metadata: session.metadata,
      line_items: session.line_items?.data,
    });

  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to retrieve checkout session' 
    });
  }
});

// Stripe webhook endpoint (for future use)
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('Webhook secret not configured');
    return res.status(400).send('Webhook secret not configured');
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    // Map webhook to connected account owner when available
    const accountId = event.account || event.data?.object?.account || null;
    let ownerProfileId = null;
    if (accountId && supabase) {
      try {
        const { data: rows, error } = await supabase
          .from('connected_accounts')
          .select('owner_profile_id')
          .eq('provider', 'stripe')
          .eq('provider_account_id', accountId)
          .limit(1);

        if (error) {
          console.error('Error querying connected_accounts for webhook mapping:', error);
        } else if (rows && rows.length) {
          ownerProfileId = rows[0].owner_profile_id;
          console.log(`Mapped Stripe event to owner_profile_id=${ownerProfileId}`);
        } else {
          console.log(`No connected_account found for stripe account ${accountId}`);
        }
      } catch (dbErr) {
        console.error('Exception while mapping webhook to connected account:', dbErr);
      }
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Payment succeeded:', session.id, 'owner:', ownerProfileId || 'unknown');
        // TODO: Fulfill the order, update database, send confirmation email
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment intent succeeded:', paymentIntent.id, 'owner:', ownerProfileId || 'unknown');
        break;
      }

      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id, 'owner:', ownerProfileId || 'unknown');
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`, 'owner:', ownerProfileId || 'unknown');
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Start server
app.listen(PORT, () => {
  const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test');
  console.log(`
🚀 Payment Server Running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  Local:   http://localhost:${PORT}
  Health:  http://localhost:${PORT}/health
  
  Stripe Mode: ${isTestMode ? '🧪 TEST' : '💰 LIVE'}
  
  Ready to process payments! 💳
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down payment server...');
  process.exit(0);
});
