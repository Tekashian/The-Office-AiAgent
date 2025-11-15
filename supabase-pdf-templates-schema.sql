-- ========================================
-- PDF TEMPLATES SCHEMA
-- Szablony dokumentów PDF
-- ========================================

-- PDF TEMPLATES (Szablony PDF)
CREATE TABLE IF NOT EXISTS pdf_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  
  -- Categories
  category TEXT, -- invoice, offer, report, contract, etc
  is_favorite BOOLEAN DEFAULT false,
  
  -- Usage statistics
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pdf_templates_user ON pdf_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_templates_category ON pdf_templates(category);

-- RLS Policies
ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pdf templates" ON pdf_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
