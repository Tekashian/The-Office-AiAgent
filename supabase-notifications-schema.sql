-- ========================================
-- NOTIFICATIONS SYSTEM
-- System powiadomień o zrealizowanych zadaniach, nowych mailach itp.
-- ========================================

-- Tabela powiadomień
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Typ powiadomienia
  type TEXT NOT NULL CHECK (type IN (
    'task_completed',      -- Zadanie cron wykonane
    'task_failed',        -- Zadanie cron nieudane
    'new_email',          -- Nowy email w skrzynce
    'pdf_generated',      -- PDF wygenerowany
    'email_sent',         -- Email wysłany
    'scraping_completed', -- Scraping zakończony
    'error',              -- Błąd systemu
    'info'                -- Informacja ogólna
  )),
  
  -- Treść powiadomienia
  title TEXT NOT NULL,
  message TEXT,
  
  -- Metadane (dodatkowe dane w JSON)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  read BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Użytkownicy mogą tylko odczytywać własne powiadomienia
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Użytkownicy mogą aktualizować własne powiadomienia (oznaczanie jako przeczytane)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Użytkownicy mogą usuwać własne powiadomienia
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- System może dodawać powiadomienia (backend używa service_role)
-- Nie potrzeba policy dla INSERT - backend używa supabaseAdmin

-- ========================================
-- PRZYKŁADOWE POWIADOMIENIA (do testów)
-- ========================================

/*
-- Wstaw przykładowe powiadomienie dla testów
INSERT INTO notifications (user_id, type, title, message, metadata)
VALUES (
  'YOUR_USER_ID_HERE',
  'task_completed',
  'Zadanie "Cotygodniowy raport" wykonane',
  'PDF został wygenerowany i wysłany na email.',
  jsonb_build_object(
    'task_id', 'abc-123',
    'task_name', 'Cotygodniowy raport',
    'file_url', 'https://...'
  )
);
*/

-- ========================================
-- FUNKCJA: Automatyczne czyszczenie starych powiadomień
-- ========================================

-- Funkcja usuwająca przeczytane powiadomienia starsze niż 30 dni
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE read = true
  AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Opcjonalnie: Utwórz pg_cron job do automatycznego czyszczenia
-- Wymaga rozszerzenia pg_cron (dostępne w Supabase na wyższych planach)
/*
-- Uruchom codziennie o 2:00 AM
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 2 * * *',
  'SELECT cleanup_old_notifications();'
);
*/

-- ========================================
-- WIDOKI POMOCNICZE
-- ========================================

-- Widok: Nieprzeczytane powiadomienia użytkownika
CREATE OR REPLACE VIEW unread_notifications_count AS
SELECT 
  user_id,
  COUNT(*) as unread_count,
  MAX(created_at) as latest_notification
FROM notifications
WHERE read = false
GROUP BY user_id;

-- ========================================
-- KOMENTARZE DO KOLUMN
-- ========================================

COMMENT ON TABLE notifications IS 'System powiadomień dla użytkowników';
COMMENT ON COLUMN notifications.type IS 'Typ powiadomienia: task_completed, new_email, pdf_generated, etc.';
COMMENT ON COLUMN notifications.metadata IS 'Dodatkowe dane w formacie JSON (task_id, file_url, itp.)';
COMMENT ON COLUMN notifications.read IS 'Czy powiadomienie zostało przeczytane';

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Sprawdź strukturę tabeli
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'notifications' 
-- ORDER BY ordinal_position;

-- Policz nieprzeczytane powiadomienia
-- SELECT user_id, COUNT(*) as unread
-- FROM notifications
-- WHERE read = false
-- GROUP BY user_id;

-- ========================================
-- ROLLBACK (jeśli potrzebne)
-- ========================================

/*
DROP TABLE IF EXISTS notifications CASCADE;
DROP VIEW IF EXISTS unread_notifications_count;
DROP FUNCTION IF EXISTS cleanup_old_notifications();
*/
