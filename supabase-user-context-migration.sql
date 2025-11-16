-- ========================================
-- USER CONTEXT & AI PREFERENCES MIGRATION
-- Rozszerzenie tabeli user_profiles o kontekst dla AI
-- ========================================

-- Dodaj nowe kolumny do user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS work_description TEXT,
  ADD COLUMN IF NOT EXISTS company_description TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS ai_context_notes TEXT,
  ADD COLUMN IF NOT EXISTS email_signature TEXT,
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
    "communication_tone": "professional",
    "language": "pl",
    "email_priority": "high",
    "auto_response": false,
    "working_hours": {
      "start": "09:00",
      "end": "17:00",
      "timezone": "Europe/Warsaw"
    },
    "notification_preferences": {
      "email": true,
      "daily_summary": false,
      "task_reminders": true
    }
  }'::jsonb;

-- Dodaj indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_user_profiles_job_title ON user_profiles(job_title);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON user_profiles(company);

-- Dodaj komentarze do kolumn dla dokumentacji
COMMENT ON COLUMN user_profiles.job_title IS 'Stanowisko użytkownika (np. "Senior Marketing Manager")';
COMMENT ON COLUMN user_profiles.work_description IS 'Opis obowiązków zawodowych - używany przez AI do kontekstualizacji zadań';
COMMENT ON COLUMN user_profiles.company_description IS 'Opis firmy i branży - pomaga AI zrozumieć kontekst biznesowy';
COMMENT ON COLUMN user_profiles.department IS 'Dział w firmie (np. "Marketing", "Sprzedaż")';
COMMENT ON COLUMN user_profiles.ai_context_notes IS 'Dodatkowe notatki dla AI - preferencje stylu, często używane frazy, specyfika pracy';
COMMENT ON COLUMN user_profiles.email_signature IS 'Podpis email z placeholderami: {{name}}, {{company}}, {{position}}, {{phone}}';
COMMENT ON COLUMN user_profiles.preferences IS 'Preferencje JSON: ton komunikacji, język, godziny pracy, notyfikacje';

-- ========================================
-- PRZYKŁADOWE DANE (opcjonalne - do testów)
-- ========================================

-- Aktualizuj istniejących użytkowników z przykładowym kontekstem
-- UWAGA: Zakomentuj jeśli nie chcesz dodawać przykładowych danych

/*
UPDATE user_profiles 
SET 
  job_title = 'Marketing Manager',
  work_description = 'Zarządzam kampaniami marketingowymi, tworzę raporty sprzedażowe i koordynuję zespół 5 osób.',
  company_description = 'Firma zajmująca się e-commerce w branży fashion, 50 pracowników, działamy na rynku polskim.',
  department = 'Marketing',
  ai_context_notes = 'Preferuję krótkie, zwięzłe emaile. Często piszę raporty cotygodniowe. Lubię używać emoji w komunikacji wewnętrznej.',
  email_signature = E'Pozdrawiam,\n{{name}}\n{{position}}\n{{company}}\n📧 {{email}}\n📱 +48 123 456 789',
  preferences = jsonb_build_object(
    'communication_tone', 'friendly-professional',
    'language', 'pl',
    'email_priority', 'high',
    'auto_response', false,
    'working_hours', jsonb_build_object(
      'start', '08:00',
      'end', '16:00',
      'timezone', 'Europe/Warsaw'
    ),
    'notification_preferences', jsonb_build_object(
      'email', true,
      'daily_summary', true,
      'task_reminders', true
    )
  )
WHERE user_id IS NOT NULL;
*/

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Sprawdź strukturę tabeli
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' 
-- ORDER BY ordinal_position;

-- Sprawdź przykładowe dane
-- SELECT id, full_name, job_title, company, preferences->>'communication_tone' as tone
-- FROM user_profiles
-- LIMIT 5;

-- ========================================
-- ROLLBACK (jeśli potrzebne cofnięcie zmian)
-- ========================================

/*
ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS job_title,
  DROP COLUMN IF EXISTS work_description,
  DROP COLUMN IF EXISTS company_description,
  DROP COLUMN IF EXISTS department,
  DROP COLUMN IF EXISTS ai_context_notes,
  DROP COLUMN IF EXISTS email_signature,
  DROP COLUMN IF EXISTS preferences;
*/
