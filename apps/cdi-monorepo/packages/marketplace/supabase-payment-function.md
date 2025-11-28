-- Supabase Edge Function example for payment processing
-- This would be deployed to Supabase as an Edge Function
-- File: supabase/functions/process-payment/index.ts

/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

serve(async (req) => {
  try {
    const { paymentMethodId, amount, listingId, buyerId, sellerId } = await req.json()

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Calculate platform fee (10%)
    const platformFee = Math.round(amount * 0.10 * 100) // Convert to cents
    const sellerAmount = Math.round(amount * 100) - platformFee

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      application_fee_amount: platformFee,
      metadata: {
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: sellerId,
      },
    })

    if (paymentIntent.status === 'succeeded') {
      // Update transaction in database
      const { error } = await supabase
        .from('transactions')
        .update({
          payment_status: 'completed',
          stripe_payment_intent_id: paymentIntent.id,
          platform_fee: platformFee / 100,
          seller_amount: sellerAmount / 100,
        })
        .eq('listing_id', listingId)
        .eq('buyer_id', buyerId)

      if (error) throw error

      // Update listing status
      await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', listingId)

      return new Response(
        JSON.stringify({ success: true, paymentIntentId: paymentIntent.id }),
        { headers: { "Content-Type": "application/json" } }
      )
    } else {
      throw new Error('Payment failed')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
*/

-- For development purposes, you can test payments with Stripe's test mode
-- Production deployment would require:
-- 1. Setting up Supabase Edge Functions
-- 2. Configuring Stripe webhook endpoints
-- 3. Implementing proper error handling and logging
-- 4. Adding seller payout automation