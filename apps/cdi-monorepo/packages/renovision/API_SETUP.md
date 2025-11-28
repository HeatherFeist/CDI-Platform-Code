# API Key Setup Guide

This app requires a Google Gemini API key to use AI features. Here's how to get one:

## Getting Your Gemini API Key

1. **Visit Google AI Studio**: Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

2. **Sign In**: Use your Google account to sign in

3. **Create API Key**: 
   - Click "Create API Key"
   - Choose "Create API key in new project" (recommended) or select an existing project
   - Your API key will be generated

4. **Copy the API Key**: Copy the generated API key (it starts with "AIza...")

5. **Add to App**: 
   - The app will prompt you to enter your API key when you first load it
   - Or click "Setup API Key" in the blue banner
   - Paste your API key and click "Save"

## Privacy & Security

- ✅ **Your API key is stored locally** in your browser's localStorage
- ✅ **Never sent to our servers** - all AI requests go directly from your browser to Google
- ✅ **You control the costs** - usage is billed to your Google Cloud account
- ✅ **Easy to change** - click "Change" next to the green checkmark to update your key

## Usage & Costs

- Gemini API has a generous free tier
- You only pay for what you use
- Typical image generation costs a few cents per request
- Monitor usage in your [Google Cloud Console](https://console.cloud.google.com/)

## Troubleshooting

**"API key appears to be invalid"**
- Make sure you copied the full key (should start with "AIza")
- Check that the API key was created successfully in Google AI Studio
- Verify your Google Cloud project has the Gemini API enabled

**"API key is required" errors**
- The app couldn't find your stored API key
- Re-enter your API key in the setup modal

**Features not working**
- Make sure you've entered a valid API key
- Check that you have remaining quota in your Google Cloud account