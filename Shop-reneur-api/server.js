/**
 * Shop'reneur API Server
 * Handles OAuth, social posting, and payment processing
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Firebase Admin SDK (for database access)
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-key.json'); // Download from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ====================
// FACEBOOK OAUTH ROUTES
// ====================

/**
 * Step 1: Initiate Facebook OAuth
 */
app.get('/auth/facebook', (req, res) => {
  const { userId } = req.query;
  
  const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${process.env.FACEBOOK_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI)}` +
    `&scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish` +
    `&state=${userId}`;
  
  res.redirect(fbAuthUrl);
});

/**
 * Step 2: Handle Facebook OAuth callback
 */
app.get('/auth/facebook/callback', async (req, res) => {
  const { code, state: userId } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!code) {
    return res.redirect(`${frontendUrl}?error=oauth_failed`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
          code
        }
      }
    );

    const { access_token, expires_in } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me`,
      {
        params: {
          fields: 'id,name,picture',
          access_token
        }
      }
    );

    const fbUser = userResponse.data;

    // Get user's Facebook Pages
    const pagesResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts`,
      {
        params: { access_token }
      }
    );

    const pages = pagesResponse.data.data || [];
    const primaryPage = pages[0]; // Use first page

    // Exchange short-lived token for long-lived token (60 days)
    const longLivedResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          fb_exchange_token: access_token
        }
      }
    );

    const longLivedToken = longLivedResponse.data.access_token;

    // Save to Firestore
    await db.collection('socialConnections').doc(`${userId}_facebook`).set({
      userId,
      platform: 'facebook',
      isConnected: true,
      accessToken: longLivedToken,
      userId: fbUser.id,
      userName: fbUser.name,
      profileUrl: fbUser.picture?.data?.url,
      pageId: primaryPage?.id,
      pageName: primaryPage?.name,
      pageAccessToken: primaryPage?.access_token,
      connectedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
    });

    res.redirect(`${frontendUrl}?success=facebook`);
  } catch (error) {
    console.error('Facebook OAuth error:', error.response?.data || error);
    res.redirect(`${frontendUrl}?error=${error.message}`);
  }
});

// ====================
// INSTAGRAM OAUTH ROUTES
// ====================

/**
 * Step 1: Initiate Instagram OAuth (via Facebook)
 */
app.get('/auth/instagram', (req, res) => {
  const { userId } = req.query;
  
  const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${process.env.FACEBOOK_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI)}` +
    `&scope=instagram_basic,instagram_content_publish,pages_show_list` +
    `&state=${userId}`;
  
  res.redirect(fbAuthUrl);
});

/**
 * Step 2: Handle Instagram OAuth callback
 */
app.get('/auth/instagram/callback', async (req, res) => {
  const { code, state: userId } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!code) {
    return res.redirect(`${frontendUrl}?error=oauth_failed`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
          code
        }
      }
    );

    const { access_token } = tokenResponse.data;

    // Get Facebook Pages
    const pagesResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts`,
      {
        params: { access_token }
      }
    );

    const pages = pagesResponse.data.data || [];
    
    // Get Instagram Business Account connected to page
    let igAccount = null;
    for (const page of pages) {
      try {
        const igResponse = await axios.get(
          `https://graph.facebook.com/v18.0/${page.id}`,
          {
            params: {
              fields: 'instagram_business_account',
              access_token: page.access_token
            }
          }
        );

        if (igResponse.data.instagram_business_account) {
          // Get IG account details
          const igDetailsResponse = await axios.get(
            `https://graph.facebook.com/v18.0/${igResponse.data.instagram_business_account.id}`,
            {
              params: {
                fields: 'id,username,profile_picture_url',
                access_token: page.access_token
              }
            }
          );

          igAccount = {
            id: igDetailsResponse.data.id,
            username: igDetailsResponse.data.username,
            profileUrl: igDetailsResponse.data.profile_picture_url,
            pageId: page.id,
            pageAccessToken: page.access_token
          };
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!igAccount) {
      return res.redirect(
        `${frontendUrl}?error=no_instagram_business_account`
      );
    }

    // Save to Firestore
    await db.collection('socialConnections').doc(`${userId}_instagram`).set({
      userId,
      platform: 'instagram',
      isConnected: true,
      accessToken: igAccount.pageAccessToken,
      igBusinessAccountId: igAccount.id,
      userName: igAccount.username,
      profileUrl: igAccount.profileUrl,
      pageId: igAccount.pageId,
      connectedAt: new Date().toISOString()
    });

    res.redirect(`${frontendUrl}?success=instagram`);
  } catch (error) {
    console.error('Instagram OAuth error:', error.response?.data || error);
    res.redirect(`${frontendUrl}?error=${error.message}`);
  }
});

// ====================
// SOCIAL POSTING ROUTES
// ====================

/**
 * Post to Facebook
 */
app.post('/api/social/facebook/post', async (req, res) => {
  const { userId, message, imageUrl, link } = req.body;

  try {
    // Get user's Facebook connection
    const connectionDoc = await db
      .collection('socialConnections')
      .doc(`${userId}_facebook`)
      .get();

    if (!connectionDoc.exists) {
      return res.status(401).json({ error: 'Not connected to Facebook' });
    }

    const connection = connectionDoc.data();
    const accessToken = connection.pageAccessToken || connection.accessToken;
    const pageId = connection.pageId || connection.userId;

    // Post to Facebook
    const postData = { message, access_token: accessToken };
    
    if (imageUrl) {
      postData.url = imageUrl;
    }
    
    if (link) {
      postData.link = link;
    }

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      postData
    );

    res.json({
      success: true,
      postId: response.data.id,
      postUrl: `https://facebook.com/${response.data.id}`
    });
  } catch (error) {
    console.error('Facebook post error:', error.response?.data || error);
    res.status(500).json({
      error: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * Post to Instagram
 */
app.post('/api/social/instagram/post', async (req, res) => {
  const { userId, caption, imageUrl } = req.body;

  try {
    // Get user's Instagram connection
    const connectionDoc = await db
      .collection('socialConnections')
      .doc(`${userId}_instagram`)
      .get();

    if (!connectionDoc.exists) {
      return res.status(401).json({ error: 'Not connected to Instagram' });
    }

    const connection = connectionDoc.data();
    const accessToken = connection.accessToken;
    const igAccountId = connection.igBusinessAccountId;

    // Step 1: Create media container
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      {
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken
      }
    );

    const containerId = containerResponse.data.id;

    // Step 2: Publish media
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      {
        creation_id: containerId,
        access_token: accessToken
      }
    );

    res.json({
      success: true,
      postId: publishResponse.data.id,
      postUrl: `https://instagram.com/p/${publishResponse.data.id}`
    });
  } catch (error) {
    console.error('Instagram post error:', error.response?.data || error);
    res.status(500).json({
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// ====================
// CONNECTION MANAGEMENT
// ====================

/**
 * Get user's social connections
 */
app.get('/api/social/connections/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const snapshot = await db
      .collection('socialConnections')
      .where('userId', '==', userId)
      .get();

    const connections = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Don't send access tokens to frontend
      delete data.accessToken;
      delete data.pageAccessToken;
      connections.push(data);
    });

    res.json(connections);
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Disconnect social account
 */
app.post('/api/social/disconnect', async (req, res) => {
  const { userId, platform } = req.body;

  try {
    await db
      .collection('socialConnections')
      .doc(`${userId}_${platform}`)
      .delete();

    res.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ====================
// STRIPE PAYMENT ROUTES
// ====================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create payment intent
 */
app.post('/api/payments/create-intent', async (req, res) => {
  const { amount, currency = 'usd', userId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: { userId }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Award coins after successful payment
 */
app.post('/api/payments/award-coins', async (req, res) => {
  const { userId, amount, paymentIntentId } = req.body;

  try {
    // Verify payment was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Award coins (1% back in coins)
    const coinsToAward = Math.floor(amount * 0.01);

    // Update wallet in Firestore
    const walletRef = db.collection('wallets').doc(userId);
    const walletDoc = await walletRef.get();

    if (!walletDoc.exists) {
      await walletRef.set({
        userId,
        totalBalance: coinsToAward,
        totalValue: coinsToAward,
        merchantCoins: [],
        transactions: [{
          id: paymentIntentId,
          type: 'earned',
          amount: coinsToAward,
          description: 'Purchase reward',
          timestamp: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      await walletRef.update({
        totalBalance: admin.firestore.FieldValue.increment(coinsToAward),
        totalValue: admin.firestore.FieldValue.increment(coinsToAward),
        transactions: admin.firestore.FieldValue.arrayUnion({
          id: paymentIntentId,
          type: 'earned',
          amount: coinsToAward,
          description: 'Purchase reward',
          timestamp: new Date().toISOString()
        }),
        updatedAt: new Date().toISOString()
      });
    }

    res.json({ success: true, coinsAwarded: coinsToAward });
  } catch (error) {
    console.error('Award coins error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Refund payment
 */
app.post('/api/payments/refund', async (req, res) => {
  const { paymentIntentId, amount } = req.body;

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined
    });

    res.json({ success: true, refundId: refund.id });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ====================
// HEALTH CHECK
// ====================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Shop'reneur API server running on port ${PORT}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
