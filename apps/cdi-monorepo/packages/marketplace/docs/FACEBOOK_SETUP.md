# Facebook Integration Setup Guide

This guide will help you set up Facebook integration for Trader Bid, allowing users to share auctions and trades on their Facebook profiles, pages, and groups.

## Prerequisites

1. **Facebook Developer Account**: You'll need a Facebook Developer account to create an app
2. **Domain Verification**: Your domain needs to be verified with Facebook for production use
3. **Business Verification**: Required for Facebook Marketplace API access

## Facebook App Setup

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" and select "Consumer" or "Business" type
3. Fill in your app details:
   - **App Name**: "Trader Bid" (or your preferred name)
   - **Contact Email**: Your contact email
   - **App Purpose**: "Provide a service to other businesses"

### 2. Configure App Settings

1. In your app dashboard, go to **Settings > Basic**
2. Add your app domains:
   - **App Domains**: `yourdomain.com`
   - **Privacy Policy URL**: `https://yourdomain.com/privacy`
   - **Terms of Service URL**: `https://yourdomain.com/terms`

### 3. Add Facebook Login Product

1. In the left sidebar, click **Add Product**
2. Find **Facebook Login** and click **Set Up**
3. Configure settings:
   - **Valid OAuth Redirect URIs**: 
     - `https://yourdomain.com`
     - `http://localhost:3000` (for development)
   - **Deauthorize Callback URL**: `https://yourdomain.com/auth/facebook/deauthorize`

### 4. Configure App Review & Permissions

For production use, you'll need to request permissions:

#### Standard Permissions (Auto-approved)
- `public_profile`
- `email`

#### Advanced Permissions (Requires Review)
- `pages_manage_posts` - For posting to Facebook pages
- `pages_read_engagement` - For reading page insights
- `publish_to_groups` - For posting to Facebook groups
- `user_posts` - For posting to user timeline

### 5. Get App Credentials

1. Go to **Settings > Basic**
2. Copy your **App ID** and **App Secret**
3. Add to your environment variables

## Environment Configuration

Add to your `.env` file:

```bash
# Facebook Integration
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
```

## Database Schema Deployment

Run the Facebook integration schema:

```sql
-- Execute the content of src/database/facebook-integration-schema.sql
-- This creates the necessary tables for Facebook integration
```

## Testing Facebook Integration

### Development Testing

1. Add test users in Facebook App dashboard
2. Use test users to authenticate and test sharing
3. Verify all sharing flows work correctly

### Production Checklist

- [ ] Facebook App is in Live mode (not Development)
- [ ] All required permissions are approved
- [ ] Domain is verified and added to app settings
- [ ] Privacy Policy and Terms of Service are accessible
- [ ] App Review submissions are approved
- [ ] Business verification completed (for Marketplace)

## Features Included

### 1. Facebook Authentication
- Login with Facebook
- Import user profile information
- Secure token management

### 2. Content Sharing
- **Timeline Sharing**: Share auctions/trades to user's timeline
- **Group Sharing**: Share to selected Facebook groups
- **Page Sharing**: Share to managed Facebook pages
- **Marketplace**: Cross-post to Facebook Marketplace (business accounts)

### 3. Auto-sharing
- Automatic sharing when new auctions are created
- Automatic sharing when trade proposals are made
- User-configurable sharing preferences

### 4. Analytics & Insights
- Track sharing success/failure rates
- Monitor engagement metrics
- Share performance analytics

## User Experience

### Connecting Facebook

1. Users go to **Settings > Social Settings**
2. Click **Connect Facebook**
3. Authorize required permissions
4. Configure sharing preferences

### Sharing Content

#### Manual Sharing
- Click Facebook share button on auction/trade pages
- Choose sharing destinations (timeline, groups, pages)
- View sharing results

#### Automatic Sharing
- Enable in Social Settings
- Configure which content types to auto-share
- Select destinations for auto-sharing

## Privacy & Security

### Data Handling
- User Facebook data is encrypted at rest
- Access tokens are securely stored
- No Facebook data is shared with third parties

### User Control
- Users can disconnect Facebook anytime
- Granular control over sharing preferences
- Clear indication of what will be shared

### Compliance
- GDPR compliant data handling
- Facebook Platform Policy compliant
- Transparent privacy practices

## Troubleshooting

### Common Issues

1. **"App Not Setup" Error**
   - Verify App ID is correct in environment variables
   - Ensure Facebook app is in correct mode (Development/Live)

2. **Permission Denied Errors**
   - Check if required permissions are approved
   - Verify user has granted necessary permissions

3. **Sharing Failures**
   - Check Facebook app status
   - Verify access token validity
   - Ensure content meets Facebook community standards

### Debug Mode

Enable debug logging by setting:
```javascript
// In FacebookService.ts
const DEBUG_MODE = true;
```

This will log detailed information about API calls and responses.

## API Rate Limits

Facebook has rate limits for their APIs:
- **User Access Token**: 200 calls per hour per user
- **Page Access Token**: 4800 calls per hour per page
- **App Access Token**: 4800 calls per hour

The integration includes automatic retry logic and rate limit handling.

## Support

For additional help:
1. Check [Facebook Developer Documentation](https://developers.facebook.com/docs/)
2. Visit [Facebook Developer Community](https://developers.facebook.com/community/)
3. Contact platform support for app-specific issues

## Compliance Notes

- Review Facebook's [Platform Policy](https://developers.facebook.com/policy/)
- Ensure content shared meets [Community Standards](https://www.facebook.com/communitystandards/)
- Follow [Data Use Policy](https://developers.facebook.com/policy/datalayer/)
- Implement proper [App Review](https://developers.facebook.com/docs/app-review/) process