# Home Reno Pro - Backend Cloud Functions

This directory contains the server-side backend logic for the Home Reno Pro application, built using Firebase Cloud Functions.

The primary function here is `getCostEstimate`, which provides live, localized pricing data for products, replacing the mock data previously used in the frontend application.

## Getting Started

Follow these steps to set up and deploy your backend function.

### 1. Install Dependencies

Before you can deploy, you need to install the necessary Node.js packages. Navigate to this `functions` directory in your terminal and run:

```bash
npm install
```

This will install packages like `firebase-functions`, `firebase-admin`, `axios`, and `cors`.

### 2. Configure API Keys (Crucial for Live Data)

To fetch real-time prices, you need API keys from retailers (e.g., Amazon Product Advertising API, Walmart's affiliate program).

**NEVER store API keys directly in your code.** Use Firebase's secure environment configuration system.

For each key you obtain, run the following command in your terminal from the project's root directory:

```bash
# Example for Amazon
firebase functions:config:set retailer.amazon_key="YOUR_SECRET_AMAZON_API_KEY"

# Example for Walmart
firebase functions:config:set retailer.walmart_key="YOUR_SECRET_WALMART_API_KEY"
```

You can then access these keys securely within `functions/src/index.ts` like so:
`functions.config().retailer.amazon_key`

### 3. Implement Your Data Fetching Logic

Open `functions/src/index.ts` and find the `getRealPrices` function.

This function is currently a **placeholder**. You need to replace the mock data logic with actual API calls to the services you configured in Step 2. We have included pseudo-code using `axios` to show you how you might do this.

### 4. Deploy the Function

Once you've installed dependencies and configured your keys, deploy the function to Firebase. Run this command from your project's root directory:

```bash
firebase deploy --only functions
```

After a successful deployment, the Firebase CLI will provide you with a **Function URL**. It will look something like this:

`https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/getCostEstimate`

Copy this URL.

### 5. Update the Frontend

Finally, you need to tell your frontend application to call this new backend endpoint.

1. Open `App.tsx` in your main project directory.
2. Find the `handleSendMessage` function.
3. Inside it, find the `getCostEstimate` function.
4. Replace the placeholder URL with the **Function URL** you copied in the previous step.

That's it! Your app will now call your secure backend function, which will fetch live data and pass it to the Gemini model for a realistic and accurate cost estimate.