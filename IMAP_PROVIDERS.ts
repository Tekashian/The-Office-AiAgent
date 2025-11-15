// Example IMAP Configurations for different email providers

export const IMAP_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    imap_host: 'imap.gmail.com',
    imap_port: 993,
    use_ssl: true,
    setup_instructions: `
      1. Enable 2-Factor Authentication in Google Account
      2. Go to: https://myaccount.google.com/apppasswords
      3. Generate App Password for "Mail"
      4. Use App Password instead of account password
    `,
  },
  
  outlook: {
    name: 'Outlook.com / Hotmail',
    imap_host: 'outlook.office365.com',
    imap_port: 993,
    use_ssl: true,
    setup_instructions: `
      1. Go to Settings → Sync email
      2. Enable IMAP access
      3. Use your Microsoft account password
    `,
  },
  
  office365: {
    name: 'Office 365 / Microsoft 365',
    imap_host: 'outlook.office365.com',
    imap_port: 993,
    use_ssl: true,
    setup_instructions: `
      1. Check with your IT admin if IMAP is enabled
      2. Use your work email and password
    `,
  },
  
  yahoo: {
    name: 'Yahoo Mail',
    imap_host: 'imap.mail.yahoo.com',
    imap_port: 993,
    use_ssl: true,
    setup_instructions: `
      1. Go to Account Security
      2. Generate App Password
      3. Use App Password instead of account password
    `,
  },
  
  icloud: {
    name: 'iCloud Mail',
    imap_host: 'imap.mail.me.com',
    imap_port: 993,
    use_ssl: true,
    setup_instructions: `
      1. Go to appleid.apple.com
      2. Generate App-Specific Password
      3. Use App Password instead of account password
    `,
  },
  
  zoho: {
    name: 'Zoho Mail',
    imap_host: 'imap.zoho.com',
    imap_port: 993,
    use_ssl: true,
    setup_instructions: `
      1. Use your Zoho email and password
      2. Enable IMAP in Settings if needed
    `,
  },
  
  protonmail: {
    name: 'ProtonMail',
    imap_host: '127.0.0.1',
    imap_port: 1143,
    use_ssl: false,
    setup_instructions: `
      1. Install ProtonMail Bridge (desktop app)
      2. Start Bridge and configure
      3. Use Bridge credentials (not ProtonMail password)
      4. Bridge must be running for IMAP to work
    `,
  },
  
  custom: {
    name: 'Custom Server',
    imap_host: 'mail.yourdomain.com',
    imap_port: 993, // or 143 for non-SSL
    use_ssl: true,
    setup_instructions: `
      1. Contact your email provider for IMAP settings
      2. Common ports: 993 (SSL), 143 (non-SSL)
      3. Use your email username and password
    `,
  },
};

// Test IMAP connection example
export const testImapConnection = async (config: {
  host: string;
  port: number;
  user: string;
  password: string;
  ssl: boolean;
}) => {
  // This would be implemented in backend
  console.log('Testing IMAP connection...', config);
};
