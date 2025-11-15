# Instrukcja naprawy błędu 500

## Problem
Backend zwraca błąd 500 przy próbie dostępu do `/api/email-templates` - oznacza to, że **tabele nie zostały utworzone w Supabase**.

## Rozwiązanie

### Krok 1: Wykonaj SQL Schema
1. Otwórz Supabase Dashboard: https://supabase.com/dashboard
2. Wybierz swój projekt
3. Przejdź do **SQL Editor** (ikona z bazy danych po lewej stronie)
4. Kliknij **New Query**
5. Skopiuj całą zawartość pliku `supabase-email-templates-schema.sql`
6. Wklej do edytora SQL
7. Kliknij **RUN** (lub Ctrl+Enter)

### Krok 2: Sprawdź czy tabele zostały utworzone
W SQL Editor wykonaj:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('email_templates', 'email_attachments', 'scheduled_emails');
```

Powinieneś zobaczyć 3 tabele.

### Krok 3: Odśwież stronę w przeglądarce
Po utworzeniu tabel, odśwież stronę `/email` - błędy 500 powinny zniknąć!

## Co zawiera schema?
- `email_templates` - szablony emaili z kategoriami
- `email_attachments` - załączniki do emaili
- `scheduled_emails` - zaplanowane emaile
- Polityki RLS dla bezpieczeństwa
- Indeksy dla wydajności

## Testowanie
Po wykonaniu schema, sprawdź:
1. Lista szablonów ładuje się bez błędów
2. Można utworzyć nowy szablon
3. Przycisk "Wygeneruj szablon AI" działa
4. Można dodawać załączniki

---

**Hint**: Jeśli nadal widzisz błąd 500, sprawdź logi backendu - powinny pokazać dokładny błąd Supabase (np. "relation 'email_templates' does not exist").
