# 🚀 Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- Git installed
- A Google Gemini API key (free at https://aistudio.google.com/app/apikey)

## Setup Steps

### 1. Get Your Free Gemini API Key
1. Visit https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API key"
4. Copy your API key

### 2. Configure Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Open `.env` file and add your Gemini API key:
   ```env
   AI_API_KEY=your_gemini_api_key_here
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```
   
   ✅ Backend should be running on http://localhost:3001

### 3. Configure Frontend
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   
   ✅ Frontend should be running on http://localhost:3000

### 4. Test the AI Agent
1. Open your browser and go to http://localhost:3000
2. Click on "AI Agent" in the sidebar
3. Type a message like "Hello! What can you do?"
4. Press Enter or click Send

🎉 **You're all set!** The AI agent is now connected and ready to help with office automation tasks.

## Available Features
- **AI Agent Chat** - Conversational AI assistant powered by Google Gemini
- **Email Automation** - Send emails programmatically
- **PDF Generation** - Create PDF documents from templates
- **Web Scraping** - Extract data from websites
- **Task Scheduling** - Set up automated cron jobs
- **Dashboard** - Monitor your automation tasks

## Gemini API Limits (Free Tier)
- 15 requests per minute
- 1 million tokens per minute
- 1,500 requests per day

## Troubleshooting

### Backend won't start
- Make sure port 3001 is not in use
- Check that your `.env` file has the correct API key
- Run `npm install` again

### Frontend won't connect to backend
- Verify backend is running on http://localhost:3001
- Check browser console for errors (F12)
- Make sure `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3001`

### AI not responding
- Verify your Gemini API key is correct
- Check backend terminal for error messages
- Make sure you haven't exceeded the free tier limits

## Next Steps
- Explore other pages in the application
- Configure Supabase for data persistence
- Set up email credentials for email automation
- Create custom PDF templates
- Schedule automated tasks

## Documentation
- Full documentation: `README.md`
- User guide: `USER_GUIDE.md`
- Frontend details: `frontend/FRONTEND_README.md`
