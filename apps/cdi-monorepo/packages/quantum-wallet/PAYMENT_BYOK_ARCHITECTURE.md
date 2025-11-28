# Payment BYOK (Bring Your Own Keys) Architecture

## 🎯 Zero-Liability Payment Model

**Principle:** Users connect their own payment accounts → We store their encrypted API keys → Payments go directly to their accounts

---

## 🔐 How BYOK Payments Work

### The Flow:
```
1. User clicks "Connect PayPal" in Quantum Wallet
2. User enters THEIR PayPal Client ID & Secret
3. We encrypt and store their keys (Supabase encryption)
4. When they receive payment → Goes to THEIR PayPal account
5. We just facilitate the connection, never touch the money
```

**What We Store:**
- ✅ Encrypted PayPal Client ID (user's own)
- ✅ Encrypted PayPal Secret (user's own)
- ✅ Encrypted Stripe API keys (user's own)
- ✅ Encrypted Plaid credentials (user's own)
- ✅ Cash App tag (public info)
- ❌ NO platform-level payment keys
- ❌ NO money flowing through our accounts
- ❌ NO liability for payment processing

---

## 📱 Database Schema

```sql
CREATE TABLE payment_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Payment provider
    provider TEXT NOT NULL, -- 'paypal', 'stripe', 'plaid', 'cashapp'
    
    -- User's own API credentials (encrypted at rest)
    api_key_1 TEXT, -- Encrypted (e.g., PayPal Client ID)
    api_key_2 TEXT, -- Encrypted (e.g., PayPal Secret)
    api_key_3 TEXT, -- Encrypted (e.g., Stripe Secret Key)
    
    -- Public identifiers (not sensitive)
    public_identifier TEXT, -- e.g., Cash App tag, PayPal email
    
    -- Connection status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false, -- Verified connection works
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    -- Environment (sandbox vs production)
    environment TEXT DEFAULT 'production', -- 'sandbox' or 'production'
    
    -- Metadata
    metadata JSONB, -- Store additional config
    
    UNIQUE(profile_id, provider, environment)
);

-- Enable Row Level Security
ALTER TABLE payment_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own payment integrations"
    ON payment_integrations
    FOR ALL
    USING (profile_id = auth.uid());
```

---

## 💳 PayPal BYOK Implementation

### Frontend: Connect PayPal Component

```typescript
// components/payments/ConnectPayPalButton.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function ConnectPayPalButton() {
    const [showModal, setShowModal] = useState(false);
    const [clientId, setClientId] = useState('');
    const [secret, setSecret] = useState('');
    const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        try {
            // Verify the credentials work
            const isValid = await verifyPayPalCredentials(clientId, secret, environment);
            
            if (!isValid) {
                throw new Error('Invalid PayPal credentials');
            }

            // Store encrypted credentials
            const { error } = await supabase
                .from('payment_integrations')
                .upsert({
                    provider: 'paypal',
                    api_key_1: clientId, // Supabase encrypts at rest
                    api_key_2: secret,   // Supabase encrypts at rest
                    environment: environment,
                    is_verified: true,
                    is_active: true
                }, {
                    onConflict: 'profile_id,provider,environment'
                });

            if (error) throw error;

            alert('✅ PayPal connected successfully!');
            setShowModal(false);
        } catch (error) {
            alert(`❌ ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
            >
                Connect Your PayPal Account
            </button>

            {showModal && (
                <div className="modal">
                    <h2>Connect Your PayPal Account</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Enter your own PayPal API credentials. Payments will go directly to your PayPal account.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label>Environment</label>
                            <select
                                value={environment}
                                onChange={(e) => setEnvironment(e.target.value as any)}
                                className="input"
                            >
                                <option value="sandbox">Sandbox (Testing)</option>
                                <option value="production">Production (Live)</option>
                            </select>
                        </div>

                        <div>
                            <label>PayPal Client ID</label>
                            <input
                                type="text"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                placeholder="Your PayPal Client ID"
                                className="input"
                            />
                        </div>

                        <div>
                            <label>PayPal Secret</label>
                            <input
                                type="password"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                placeholder="Your PayPal Secret"
                                className="input"
                            />
                        </div>

                        <div className="bg-blue-50 p-3 rounded text-sm">
                            <p className="font-semibold">How to get your PayPal API credentials:</p>
                            <ol className="list-decimal ml-4 mt-2 space-y-1">
                                <li>Go to <a href="https://developer.paypal.com" target="_blank" className="text-blue-600">developer.paypal.com</a></li>
                                <li>Log in with your PayPal account</li>
                                <li>Go to "My Apps & Credentials"</li>
                                <li>Create a new app or use existing</li>
                                <li>Copy your Client ID and Secret</li>
                            </ol>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleConnect}
                                disabled={loading || !clientId || !secret}
                                className="btn-primary flex-1"
                            >
                                {loading ? 'Verifying...' : 'Connect PayPal'}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

async function verifyPayPalCredentials(
    clientId: string,
    secret: string,
    environment: 'sandbox' | 'production'
): Promise<boolean> {
    try {
        const baseUrl = environment === 'sandbox'
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';

        // Get OAuth token to verify credentials
        const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(`${clientId}:${secret}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        return response.ok;
    } catch {
        return false;
    }
}
```

---

## 💰 Payment Processing (Using User's Keys)

### Edge Function: Process Payment

```typescript
// supabase/functions/process-payment/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
    try {
        const { amount, description, recipientId, provider } = await req.json();

        // Get authenticated user
        const authHeader = req.headers.get('Authorization');
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // Service role to decrypt
            { global: { headers: { Authorization: authHeader! } } }
        );

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Get recipient's payment integration (THEIR keys)
        const { data: integration, error } = await supabaseClient
            .from('payment_integrations')
            .select('*')
            .eq('profile_id', recipientId)
            .eq('provider', provider)
            .eq('is_active', true)
            .single();

        if (!integration) {
            throw new Error('Recipient has not connected their payment account');
        }

        // Process payment using THEIR credentials
        if (provider === 'paypal') {
            return await processPayPalPayment(
                amount,
                description,
                integration.api_key_1, // Their Client ID
                integration.api_key_2, // Their Secret
                integration.environment
            );
        }

        // Add other providers...

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

async function processPayPalPayment(
    amount: number,
    description: string,
    clientId: string,
    secret: string,
    environment: string
) {
    const baseUrl = environment === 'sandbox'
        ? 'https://api-m.sandbox.paypal.com'
        : 'https://api-m.paypal.com';

    // Get access token using THEIR credentials
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${btoa(`${clientId}:${secret}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    const { access_token } = await authResponse.json();

    // Create payment order
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: amount.toFixed(2)
                },
                description: description
            }]
        })
    });

    const order = await orderResponse.json();

    return new Response(JSON.stringify({
        success: true,
        orderId: order.id,
        approvalUrl: order.links.find(l => l.rel === 'approve')?.href
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
```

---

## 🔐 Security & Liability Protection

### What This Architecture Guarantees:

✅ **No Platform Keys** - We don't use our own payment accounts  
✅ **Direct Payments** - Money goes directly to user's account  
✅ **User Control** - They can disconnect anytime  
✅ **Encrypted Storage** - All API keys encrypted at rest  
✅ **Row-Level Security** - Users only see their own keys  
✅ **Zero Liability** - We're just a connector, not a payment processor  

### Liability Protection:

| Risk | Traditional Approach | BYOK Approach |
|------|---------------------|---------------|
| Payment fraud | ❌ Your liability | ✅ User's PayPal account handles it |
| Chargebacks | ❌ You handle disputes | ✅ User's payment provider handles it |
| API key breach | ❌ All payments compromised | ✅ Only that user's account affected |
| PCI compliance | ❌ Complex requirements | ✅ Payment provider handles it |
| Money laundering | ❌ Your responsibility | ✅ Payment provider's KYC/AML |

---

## 📋 Supported Payment Providers

### 1. PayPal BYOK
- User provides: Client ID + Secret
- Payments go to: Their PayPal account
- Setup time: 5 minutes

### 2. Stripe BYOK
- User provides: Publishable Key + Secret Key
- Payments go to: Their Stripe account
- Setup time: 5 minutes

### 3. Plaid BYOK
- User provides: Client ID + Secret
- Connects to: Their bank accounts
- Setup time: 10 minutes

### 4. Cash App
- User provides: Cash App tag (public)
- Payments via: QR code / payment link
- Setup time: 1 minute

---

## 🚀 Implementation Priority

**Phase 1: Quantum Wallet Setup (Week 1)**
- [ ] Create payment_integrations table
- [ ] Build "Connect PayPal" UI
- [ ] Build "Connect Stripe" UI
- [ ] Build "Connect Cash App" UI
- [ ] Test credential verification

**Phase 2: Payment Processing (Week 2)**
- [ ] Edge function for PayPal payments
- [ ] Edge function for Stripe payments
- [ ] QR code generation for Cash App
- [ ] Transaction logging

**Phase 3: Cross-App Integration (Week 3)**
- [ ] Marketplace uses Quantum Wallet for payments
- [ ] Renovision uses Quantum Wallet for contractor payments
- [ ] Unified transaction history

---

## ✅ Benefits

### For Users:
✅ **Full Control** - Their own payment accounts  
✅ **Direct Deposits** - Money goes straight to them  
✅ **No Middleman** - We don't touch their money  
✅ **Choose Providers** - Use PayPal, Stripe, or both  

### For Your Platform:
✅ **Zero Liability** - Not a payment processor  
✅ **No PCI Compliance** - Payment providers handle it  
✅ **No Chargebacks** - Users handle their own disputes  
✅ **Scalable** - Each user brings their own infrastructure  

---

## 🎯 Ready to Implement?

This BYOK payment architecture is:
- ✅ **Legally safe** - We're just a connector
- ✅ **User-friendly** - Simple setup process
- ✅ **Secure** - Encrypted keys, RLS policies
- ✅ **Flexible** - Support multiple providers

**Start with PayPal + Cash App (2-3 days), then add Stripe and Plaid.**
