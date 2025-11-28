// Environment validation utility
export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  stripePublishableKey: string;
  appName: string;
  appVersion: string;
  platformFeePercentage: number;
  nodeEnv: string;
}

export function validateEnvironment(): EnvironmentConfig {
  const requiredVars = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  };

  const optionalVars = {
    appName: import.meta.env.VITE_APP_NAME || 'Auction Platform',
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    platformFeePercentage: parseInt(import.meta.env.VITE_PLATFORM_FEE_PERCENTAGE || '10'),
    nodeEnv: import.meta.env.NODE_ENV || 'development',
  };

  // Check required environment variables
  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}\n\nPlease check your .env file and ensure all required variables are set.`;
    
    // In development, show user-friendly error
    if (import.meta.env.DEV) {
      console.error('Environment Configuration Error:', errorMessage);
      document.body.innerHTML = `
        <div style="padding: 20px; max-width: 600px; margin: 50px auto; font-family: Arial, sans-serif;">
          <h1 style="color: #dc2626;">Configuration Error</h1>
          <p>Missing required environment variables:</p>
          <ul>
            ${missingVars.map(varName => `<li><code>VITE_${varName.toUpperCase().replace(/([A-Z])/g, '_$1')}</code></li>`).join('')}
          </ul>
          <p>Please:</p>
          <ol>
            <li>Copy <code>.env.example</code> to <code>.env</code></li>
            <li>Fill in your Supabase credentials</li>
            <li>Restart the development server</li>
          </ol>
        </div>
      `;
    }
    
    throw new Error(errorMessage);
  }

  return {
    ...requiredVars,
    ...optionalVars,
  } as EnvironmentConfig;
}

// Export validated config
export const env = validateEnvironment();