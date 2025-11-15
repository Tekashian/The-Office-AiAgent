-- ========================================
-- EMAIL INBOX & AI ASSISTANT SCHEMA
-- Rozszerzenie dla funkcji skanowania skrzynki i AI odpowiedzi
-- ========================================

-- 1. IMAP CONFIGURATIONS (Konfiguracja odbierania emaili)
CREATE TABLE IF NOT EXISTS user_imap_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  config_name TEXT NOT NULL DEFAULT 'Default IMAP',
  imap_host TEXT NOT NULL, -- imap.gmail.com
  imap_port INTEGER NOT NULL DEFAULT 993,
  imap_user TEXT NOT NULL, -- email address
  imap_password TEXT NOT NULL, -- encrypted
  use_ssl BOOLEAN DEFAULT true,
  auto_scan BOOLEAN DEFAULT true,
  scan_interval_minutes INTEGER DEFAULT 5,
  last_scan_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. EMAILS INBOX (Odebrane emaile)
CREATE TABLE IF NOT EXISTS emails_inbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_id TEXT UNIQUE NOT NULL, -- Email Message-ID header
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_address TEXT NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- AI Analysis
  ai_analyzed BOOLEAN DEFAULT false,
  ai_priority TEXT CHECK (ai_priority IN ('urgent', 'high', 'normal', 'low')),
  ai_category TEXT, -- question, request, complaint, info, spam, etc
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
  ai_summary TEXT,
  ai_suggested_action TEXT, -- reply, forward, archive, delete
  
  -- Attachments info
  has_attachments BOOLEAN DEFAULT false,
  attachments_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. AI EMAIL DRAFTS (AI wygenerowane odpowiedzi)
CREATE TABLE IF NOT EXISTS ai_email_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  inbox_email_id UUID REFERENCES emails_inbox(id) ON DELETE CASCADE NOT NULL,
  
  -- Draft content
  to_address TEXT NOT NULL,
  cc_addresses TEXT[],
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- AI metadata
  ai_confidence DECIMAL(3,2), -- 0.00 to 1.00
  ai_reasoning TEXT, -- Why AI generated this response
  tone TEXT, -- professional, friendly, formal, casual
  
  -- User interaction
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'edited', 'approved', 'rejected', 'sent')),
  user_edited BOOLEAN DEFAULT false,
  edited_body TEXT, -- User's edited version
  
  -- Sending info
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_message_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. EMAIL SCAN LOGS (Historia skanowania)
CREATE TABLE IF NOT EXISTS email_scan_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  imap_config_id UUID REFERENCES user_imap_configs(id) ON DELETE CASCADE NOT NULL,
  
  scan_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scan_completed_at TIMESTAMP WITH TIME ZONE,
  
  emails_found INTEGER DEFAULT 0,
  emails_new INTEGER DEFAULT 0,
  emails_processed INTEGER DEFAULT 0,
  
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX idx_imap_configs_user_id ON user_imap_configs(user_id);
CREATE INDEX idx_imap_configs_active ON user_imap_configs(is_active) WHERE is_active = true;

CREATE INDEX idx_inbox_user_id ON emails_inbox(user_id);
CREATE INDEX idx_inbox_message_id ON emails_inbox(message_id);
CREATE INDEX idx_inbox_unread ON emails_inbox(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_inbox_received ON emails_inbox(received_at DESC);
CREATE INDEX idx_inbox_priority ON emails_inbox(ai_priority);
CREATE INDEX idx_inbox_analyzed ON emails_inbox(ai_analyzed) WHERE ai_analyzed = false;

CREATE INDEX idx_drafts_user_id ON ai_email_drafts(user_id);
CREATE INDEX idx_drafts_inbox_id ON ai_email_drafts(inbox_email_id);
CREATE INDEX idx_drafts_status ON ai_email_drafts(status);
CREATE INDEX idx_drafts_pending ON ai_email_drafts(user_id, status) WHERE status = 'pending';

CREATE INDEX idx_scan_logs_user_id ON email_scan_logs(user_id);
CREATE INDEX idx_scan_logs_config_id ON email_scan_logs(imap_config_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE user_imap_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_scan_logs ENABLE ROW LEVEL SECURITY;

-- IMAP Configs policies
CREATE POLICY "Users can manage own IMAP configs" ON user_imap_configs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Inbox policies
CREATE POLICY "Users can view own inbox" ON emails_inbox
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own inbox" ON emails_inbox
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own inbox emails" ON emails_inbox
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Drafts policies
CREATE POLICY "Users can view own drafts" ON ai_email_drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts" ON ai_email_drafts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own drafts" ON ai_email_drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Scan logs policies
CREATE POLICY "Users can view own scan logs" ON email_scan_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan logs" ON email_scan_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- TRIGGERS
-- ========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_imap_configs_updated_at
  BEFORE UPDATE ON user_imap_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON ai_email_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FUNCTIONS
-- ========================================

-- Get unread emails count for user
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM emails_inbox
    WHERE user_id = p_user_id AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pending drafts count
CREATE OR REPLACE FUNCTION get_pending_drafts_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM ai_email_drafts
    WHERE user_id = p_user_id AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark email as read
CREATE OR REPLACE FUNCTION mark_email_read(p_email_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE emails_inbox
  SET is_read = true
  WHERE id = p_email_id AND user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
