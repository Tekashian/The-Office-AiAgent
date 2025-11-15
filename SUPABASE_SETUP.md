# Supabase Multi-User Implementation - Setup Guide

## 🎯 Overview
The project has been fully implemented with Supabase multi-user architecture. This guide will help you set up and test the system.

## 📋 What Was Implemented

### ✅ Backend Components
1. **Authentication Middleware** (`backend/src/middleware/auth.ts`)
   - JWT token validation via Supabase
   - User ID extraction from tokens
   - Optional authentication support

2. **Encryption Utilities** (`backend/src/utils/encryption.ts`)
   - AES-256-CBC encryption for sensitive data
   - Used for SMTP passwords
   - Encryption key from environment variable

3. **New Routes**:
   - **Email Config** (`/api/email-config`) - Manage user SMTP settings
   - **Email** (`/api/email`) - Send emails with user credentials
   - **PDF** (`/api/pdf`) - Generate and manage PDFs
   - **Scraper** (`/api/scraper`) - Web scraping jobs
   - **Cron** (`/api/cron`) - Scheduled task management
   - **Agent** (updated) - AI chat with history tracking

### ✅ Frontend Components
1. **Auth Utilities** (`frontend/lib/auth.ts`)
   - Sign up, sign in, sign out
   - Password reset
   - User profile management
   - Session handling

### ✅ Database Schema
Complete SQL schema in `supabase-schema.sql` with:
- 7 tables with Row Level Security (RLS)
- Automatic user profile creation
- Encrypted password storage
- Proper indexes and triggers

## 🚀 Setup Instructions

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Create a new account or sign in
3. Click "New Project"
4. Enter project details:
   - Name: `the-office-ai-agent`
   - Database Password: (generate strong password)
   - Region: (choose closest to you)
5. Wait for project to be created (~2 minutes)

### Step 2: Run SQL Schema
1. In Supabase Dashboard, go to **SQL Editor**
2. Open the file `supabase-schema.sql` from your project
3. Copy ALL content
4. Paste into SQL Editor
5. Click **Run** (bottom right)
6. Wait for success message

### Step 3: Enable Email Authentication
1. Go to **Authentication** > **Providers**
2. Find **Email** provider
3. Enable it if not already enabled
4. Save changes

### Step 4: Get API Credentials
1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 5: Generate Encryption Key
Open PowerShell in your project directory and run:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output (64 character hex string)

### Step 6: Update Environment Variables

**Backend** (`backend/.env`):
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Encryption Key
ENCRYPTION_KEY=your_64_character_hex_key_here
```

**Frontend** (`frontend/.env.local`):
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 7: Restart Servers
```powershell
# Backend
cd backend
npm run dev

# Frontend (in new terminal)
cd frontend
npm run dev
```

## 🧪 Testing the Implementation

### Test 1: Authentication
1. Create a sign-up page or use the Supabase Dashboard to create a test user
2. In Supabase Dashboard: **Authentication** > **Users** > **Add User**
3. Enter email and password
4. User should appear in the users list

### Test 2: API with Authentication
Using Postman or curl, test the authenticated endpoints:

```powershell
# Get access token first (sign in)
$body = @{
    email = "test@example.com"
    password = "your_password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/signin" -Method POST -Body $body -ContentType "application/json"
$token = $response.session.access_token

# Test email config endpoint
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

$emailConfig = @{
    smtp_host = "smtp.gmail.com"
    smtp_port = 587
    smtp_user = "your@gmail.com"
    smtp_password = "your_app_password"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/email-config" -Method POST -Body $emailConfig -Headers $headers
```

### Test 3: Chat Without Authentication (Backward Compatible)
The chat endpoint still works without authentication:
```powershell
curl http://localhost:3001/api/agent/chat -X POST -H "Content-Type: application/json" -d "{\"message\": \"Hello!\"}"
```

But saves to database if authenticated:
```powershell
curl http://localhost:3001/api/agent/chat -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "{\"message\": \"Hello!\"}"
```

## 📊 Database Structure

### Tables Created
1. **user_profiles** - User profile information
2. **user_email_configs** - Encrypted SMTP credentials per user
3. **emails_sent** - Email history
4. **pdf_files** - Generated PDFs
5. **scrape_jobs** - Web scraping jobs
6. **cron_jobs** - Scheduled tasks
7. **chat_messages** - AI conversation history

### Row Level Security (RLS)
All tables have RLS enabled - users can only access their own data.

## 🔐 Security Features

1. **JWT Authentication**: Supabase handles token generation and validation
2. **AES-256 Encryption**: SMTP passwords encrypted before storage
3. **Row Level Security**: Database-level data isolation
4. **HTTPS Only**: Supabase uses encrypted connections
5. **Environment Variables**: Secrets stored in .env files

## 📝 API Endpoints

### Authentication (use Supabase client)
- Sign Up: `supabase.auth.signUp()`
- Sign In: `supabase.auth.signInWithPassword()`
- Sign Out: `supabase.auth.signOut()`

### Email Management
- `POST /api/email-config` - Add SMTP configuration
- `GET /api/email-config` - Get configurations
- `POST /api/email-config/test` - Test configuration
- `POST /api/email/send` - Send email
- `POST /api/email/send-bulk` - Send bulk emails
- `GET /api/email/history` - Email history

### PDF Management
- `POST /api/pdf/generate` - Generate PDF
- `POST /api/pdf/generate-structured` - Generate structured PDF
- `GET /api/pdf/list` - List PDFs
- `GET /api/pdf/download/:id` - Download PDF
- `DELETE /api/pdf/:id` - Delete PDF

### Web Scraping
- `POST /api/scraper/scrape` - Scrape single page
- `POST /api/scraper/scrape-multiple` - Scrape multiple pages
- `GET /api/scraper/jobs` - List scrape jobs
- `GET /api/scraper/jobs/:id` - Get job details
- `DELETE /api/scraper/jobs/:id` - Delete job

### Cron Jobs
- `POST /api/cron/create` - Create cron job
- `GET /api/cron/jobs` - List cron jobs
- `GET /api/cron/jobs/:id` - Get job details
- `PUT /api/cron/jobs/:id` - Update job
- `POST /api/cron/jobs/:id/start` - Start job
- `POST /api/cron/jobs/:id/stop` - Stop job
- `DELETE /api/cron/jobs/:id` - Delete job

### AI Agent
- `POST /api/agent/chat` - Chat with AI (optionally authenticated)
- `POST /api/agent/task` - Process task
- `POST /api/agent/analyze` - Analyze text

## 🎨 Next Steps

### Frontend Pages to Create
1. **Login/Register Page** (`app/auth/page.tsx`)
2. **Email Settings Page** (`app/settings/email/page.tsx`)
3. **PDF Generator Page** (`app/pdf/page.tsx`)
4. **Scraper Dashboard** (`app/scraper/page.tsx`)
5. **Cron Jobs Manager** (`app/cron/page.tsx`)

### Example Login Page
```typescript
'use client';

import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUp(email, password);
        alert('Account created! Check your email.');
      } else {
        await signIn(email, password);
        alert('Logged in successfully!');
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
      <button type="button" onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have account?' : 'Need an account?'}
      </button>
    </form>
  );
}
```

## 🐛 Troubleshooting

### "No token provided" error
- Make sure to include `Authorization: Bearer <token>` header
- Get token from `supabase.auth.getSession()`

### "Invalid token" error
- Token may be expired (refresh session)
- Check SUPABASE_URL and SUPABASE_ANON_KEY are correct

### "Encryption failed" error
- Generate new ENCRYPTION_KEY using the command above
- Make sure it's 64 hex characters (32 bytes)

### "RLS policy violation" error
- Make sure user is authenticated
- Check user_id matches in database

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [MULTI_USER_ARCHITECTURE.md](./MULTI_USER_ARCHITECTURE.md) - Detailed architecture document

## ✨ Summary

Your project now has:
- ✅ Complete multi-user authentication
- ✅ Per-user data isolation
- ✅ Encrypted credential storage
- ✅ Full API implementation
- ✅ Database schema with RLS
- ✅ Frontend auth utilities

All features (email, PDF, scraper, cron, AI) are ready to use with proper user isolation!
