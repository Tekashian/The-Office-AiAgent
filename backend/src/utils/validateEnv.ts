/**
 * Environment variable validation utility
 * Validates required environment variables on startup
 */

interface EnvConfig {
  required: string[];
  optional: string[];
  warnings: string[];
}

const ENV_CONFIG: EnvConfig = {
  // Critical variables - app won't work without these
  required: [
    'AI_API_KEY',
    'AI_API_URL',
  ],
  // Important variables - app will work but with limited functionality
  optional: [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'ENCRYPTION_KEY',
  ],
  // Variables that should have warnings
  warnings: [
    'ENCRYPTION_KEY', // Critical for email config storage
  ],
};

/**
 * Validates environment variables and provides helpful error messages
 */
function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  ENV_CONFIG.required.forEach((key) => {
    if (!process.env[key]) {
      errors.push(`❌ Missing required environment variable: ${key}`);
    }
  });

  // Check warning variables
  ENV_CONFIG.warnings.forEach((key) => {
    if (!process.env[key]) {
      warnings.push(`⚠️  Missing ${key} - some features may not work correctly`);
    }
  });

  // Log warnings first
  if (warnings.length > 0) {
    console.log('\n⚠️  Configuration Warnings:');
    warnings.forEach((warning) => console.log(warning));
    console.log('');
  }

  // If there are errors, provide helpful instructions and exit
  if (errors.length > 0) {
    console.error('\n❌ Environment Configuration Error:\n');
    errors.forEach((error) => console.error(error));
    console.error('\n📝 Setup Instructions:');
    console.error('1. Copy backend/.env.example to backend/.env');
    console.error('2. Get your free Gemini API key at: https://aistudio.google.com/app/apikey');
    console.error('3. Fill in at least the required variables (AI_API_KEY, AI_API_URL)');
    console.error('4. For full functionality, also configure Supabase and Email settings');
    console.error('\nFor more details, see README.md or QUICKSTART.md\n');
    process.exit(1);
  }

  // Log success
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Environment variables validated successfully');
    
    // Show what's configured
    const configured: string[] = [];
    const notConfigured: string[] = [];
    
    ENV_CONFIG.optional.forEach((key) => {
      if (process.env[key]) {
        configured.push(key);
      } else {
        notConfigured.push(key);
      }
    });

    if (configured.length > 0) {
      console.log(`✅ Configured: ${configured.join(', ')}`);
    }
    if (notConfigured.length > 0) {
      console.log(`⚪ Optional (not configured): ${notConfigured.join(', ')}`);
    }
    console.log('');
  }
}

/**
 * Check if a specific feature is available based on environment variables
 */
function isFeatureAvailable(feature: string): boolean {
  switch (feature) {
    case 'database':
      return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
    case 'email':
      return !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
    case 'ai':
      return !!(process.env.AI_API_KEY && process.env.AI_API_URL);
    case 'encryption':
      return !!process.env.ENCRYPTION_KEY;
    default:
      return false;
  }
}

/**
 * Get missing variables for a feature
 */
function getMissingVariables(feature: string): string[] {
  const missing: string[] = [];
  
  switch (feature) {
    case 'database':
      if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
      if (!process.env.SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
      break;
    case 'email':
      if (!process.env.EMAIL_HOST) missing.push('EMAIL_HOST');
      if (!process.env.EMAIL_USER) missing.push('EMAIL_USER');
      if (!process.env.EMAIL_PASSWORD) missing.push('EMAIL_PASSWORD');
      break;
    case 'ai':
      if (!process.env.AI_API_KEY) missing.push('AI_API_KEY');
      if (!process.env.AI_API_URL) missing.push('AI_API_URL');
      break;
    case 'encryption':
      if (!process.env.ENCRYPTION_KEY) missing.push('ENCRYPTION_KEY');
      break;
  }
  
  return missing;
}

// CommonJS exports
module.exports = {
  validateEnv,
  isFeatureAvailable,
  getMissingVariables,
};
