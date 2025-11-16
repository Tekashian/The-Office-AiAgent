-- ========================================
-- WEB SCRAPER - ENHANCED SCHEMA
-- Rozszerzenie tabeli scrape_jobs o funkcje AI i monitoringu
-- ========================================

-- Najpierw sprawdźmy czy tabela istnieje, jeśli tak - dodajemy kolumny
-- Jeśli nie - tworzymy nową

-- Usuwamy starą tabelę jeśli istnieje (OSTROŻNIE - usuwa dane!)
-- DROP TABLE IF EXISTS scrape_jobs CASCADE;

-- Nowa rozszerzona tabela scrape_jobs
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Podstawowe dane
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  
  -- Konfiguracja scrapingu
  selectors JSONB DEFAULT '{}'::jsonb, -- CSS/XPath selectors: {"price": ".price", "title": "h1"}
  extraction_type TEXT DEFAULT 'manual' CHECK (extraction_type IN ('manual', 'ai', 'hybrid')),
  ai_prompt TEXT, -- "Extract product prices and names from this page"
  
  -- Filtry i warunki
  filters JSONB DEFAULT '{}'::jsonb, -- {"only_new": true, "min_price": 100}
  
  -- Monitoring zmian
  change_detection BOOLEAN DEFAULT false,
  last_data JSONB, -- Ostatnie pobrane dane
  change_detected BOOLEAN DEFAULT false,
  last_change_at TIMESTAMP WITH TIME ZONE,
  
  -- Alerty i powiadomienia
  alert_config JSONB DEFAULT '{}'::jsonb, -- {"notify_on_change": true, "price_drop_threshold": 10}
  
  -- Harmonogram
  schedule TEXT, -- Cron expression (null = jednorazowe)
  
  -- Status i wyniki
  enabled BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'scheduled')),
  result_data JSONB, -- Ostatnie pobrane dane
  error_message TEXT,
  execution_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_run TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Historia wykonań scrapera
CREATE TABLE IF NOT EXISTS scrape_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scrape_job_id UUID REFERENCES scrape_jobs(id) ON DELETE CASCADE NOT NULL,
  
  -- Dane wykonania
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  data_extracted JSONB, -- Pobrane dane
  changes_detected JSONB, -- Wykryte zmiany
  items_count INTEGER DEFAULT 0,
  
  -- Błędy
  error_message TEXT,
  error_details JSONB,
  
  -- Performance
  duration_ms INTEGER,
  
  -- Timestamps
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_user_id ON scrape_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_enabled ON scrape_jobs(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_schedule ON scrape_jobs(schedule) WHERE schedule IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scrape_history_job_id ON scrape_history(scrape_job_id);
CREATE INDEX IF NOT EXISTS idx_scrape_history_executed_at ON scrape_history(executed_at DESC);

-- RLS Policies
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own scrape jobs
CREATE POLICY "Users can view own scrape jobs" ON scrape_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scrape jobs" ON scrape_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scrape jobs" ON scrape_jobs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scrape jobs" ON scrape_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- History policies
CREATE POLICY "Users can view own scrape history" ON scrape_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scrape_jobs 
      WHERE scrape_jobs.id = scrape_history.scrape_job_id 
      AND scrape_jobs.user_id = auth.uid()
    )
  );

-- ========================================
-- PRZYKŁADOWE DANE
-- ========================================

/*
-- Manual scraping z selektorami
INSERT INTO scrape_jobs (user_id, name, url, extraction_type, selectors, schedule, change_detection)
VALUES (
  'YOUR_USER_ID',
  'Monitor cen konkurencji',
  'https://example.com/products',
  'manual',
  jsonb_build_object(
    'price', '.product-price',
    'name', 'h1.product-title',
    'stock', '.stock-status'
  ),
  '0 */6 * * *', -- Co 6 godzin
  true
);

-- AI-powered scraping
INSERT INTO scrape_jobs (user_id, name, url, extraction_type, ai_prompt, alert_config)
VALUES (
  'YOUR_USER_ID',
  'Oferty pracy - Data Science',
  'https://example.com/jobs',
  'ai',
  'Extract all job listings with: job title, company name, salary range, and location. Focus on Data Science positions.',
  jsonb_build_object(
    'notify_on_change', true,
    'keywords', jsonb_build_array('senior', 'lead', 'manager')
  )
);
*/

-- ========================================
-- FUNKCJE POMOCNICZE
-- ========================================

-- Funkcja do automatycznego update updated_at
CREATE OR REPLACE FUNCTION update_scrape_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scrape_jobs_updated_at
  BEFORE UPDATE ON scrape_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_scrape_jobs_updated_at();

-- Funkcja do czyszczenia starej historii (>90 dni)
CREATE OR REPLACE FUNCTION cleanup_old_scrape_history()
RETURNS void AS $$
BEGIN
  DELETE FROM scrape_history
  WHERE executed_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Widok: Statystyki scraperów
CREATE OR REPLACE VIEW scraper_stats AS
SELECT 
  user_id,
  COUNT(*) as total_scrapers,
  COUNT(*) FILTER (WHERE enabled = true) as active_scrapers,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_scrapers,
  COUNT(*) FILTER (WHERE change_detected = true) as scrapers_with_changes
FROM scrape_jobs
GROUP BY user_id;

-- ========================================
-- KOMENTARZE
-- ========================================

COMMENT ON TABLE scrape_jobs IS 'Web scraping jobs with AI extraction and change monitoring';
COMMENT ON COLUMN scrape_jobs.selectors IS 'CSS/XPath selectors for data extraction';
COMMENT ON COLUMN scrape_jobs.extraction_type IS 'manual (selectors), ai (natural language), hybrid (both)';
COMMENT ON COLUMN scrape_jobs.ai_prompt IS 'Natural language instruction for AI extraction';
COMMENT ON COLUMN scrape_jobs.change_detection IS 'Enable monitoring for changes between runs';
COMMENT ON COLUMN scrape_jobs.alert_config IS 'Alert rules: notify_on_change, price_drop_threshold, keywords';

-- ========================================
-- MIGRACJA (jeśli tabela już istnieje)
-- ========================================

/*
-- Jeśli masz już tabelę scrape_jobs, użyj tych komend:

ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS selectors JSONB DEFAULT '{}'::jsonb;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS extraction_type TEXT DEFAULT 'manual' CHECK (extraction_type IN ('manual', 'ai', 'hybrid'));
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS ai_prompt TEXT;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS filters JSONB DEFAULT '{}'::jsonb;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS change_detection BOOLEAN DEFAULT false;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS last_data JSONB;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS change_detected BOOLEAN DEFAULT false;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS last_change_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS alert_config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS schedule TEXT;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS last_run TIMESTAMP WITH TIME ZONE;
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Zaktualizuj CHECK constraint dla status
ALTER TABLE scrape_jobs DROP CONSTRAINT IF EXISTS scrape_jobs_status_check;
ALTER TABLE scrape_jobs ADD CONSTRAINT scrape_jobs_status_check 
  CHECK (status IN ('pending', 'running', 'completed', 'failed', 'scheduled'));
*/
