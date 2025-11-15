-- ========================================
-- EMAIL TEMPLATES SCHEMA
-- Szablony emaili i załączniki
-- ========================================

-- 1. EMAIL TEMPLATES (Szablony emaili)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Variables in template (e.g., {{name}}, {{company}})
  variables JSONB DEFAULT '[]'::jsonb,
  
  -- Categories
  category TEXT, -- offer, report, notification, follow-up, etc
  is_favorite BOOLEAN DEFAULT false,
  
  -- Usage statistics
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. EMAIL ATTACHMENTS (Załączniki)
CREATE TABLE IF NOT EXISTS email_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_sent_id UUID REFERENCES emails_sent(id) ON DELETE CASCADE,
  
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Storage path or URL
  file_size INTEGER NOT NULL, -- in bytes
  mime_type TEXT NOT NULL,
  
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SCHEDULED EMAILS (Zaplanowane emaile)
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  to_address TEXT NOT NULL,
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add attachment support to emails_sent (if not exists)
ALTER TABLE emails_sent ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT false;
ALTER TABLE emails_sent ADD COLUMN IF NOT EXISTS attachments_count INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_user ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_attachments_user ON email_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_email_attachments_email ON email_attachments(email_sent_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user ON scheduled_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_emails(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_for ON scheduled_emails(scheduled_for);

-- RLS Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Templates policies
CREATE POLICY "Users can manage own templates" ON email_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Attachments policies
CREATE POLICY "Users can manage own attachments" ON email_attachments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Scheduled emails policies
CREATE POLICY "Users can manage own scheduled emails" ON scheduled_emails
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
