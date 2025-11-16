# 📦 Supabase Storage Setup - Bucket dla PDF

## Krok 1: Utwórz bucket w Supabase Dashboard

1. Otwórz: https://supabase.com/dashboard/project/cunuvyqkijgipctivghq/storage/buckets
2. Kliknij **"New bucket"**
3. Wypełnij formularz:
   ```
   Name: generated-pdfs
   Public: ☐ (Private - dostęp tylko przez signed URLs)
   File size limit: 50 MB
   Allowed MIME types: application/pdf
   ```
4. Kliknij **"Create bucket"**

## Krok 2: Skonfiguruj RLS (Row Level Security) Policies

Przejdź do **Storage → Policies** i dodaj:

### Policy 1: Upload (INSERT)
```sql
CREATE POLICY "Users can upload their own PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generated-pdfs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 2: Download (SELECT)
```sql
CREATE POLICY "Users can access their own PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-pdfs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3: Delete (DELETE)
```sql
CREATE POLICY "Users can delete their own PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated-pdfs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Krok 3: Testowanie

Po deploymencie backend automatycznie:
- ✅ Generuje PDF w pamięci (pdfkit)
- ✅ Uploaduje do `generated-pdfs/{user_id}/{filename}.pdf`
- ✅ Tworzy signed URL ważny 7 dni
- ✅ Opcjonalnie wysyła link emailem

## Struktura folderów:

```
generated-pdfs/
├─ user-uuid-1/
│  ├─ raport_2025-11-16.pdf
│  └─ dokument_1731758400000.pdf
├─ user-uuid-2/
│  └─ raport.pdf
```

## Przykładowa konfiguracja JSON dla zadania PDF:

### Podstawowa (tylko generuje):
```json
{
  "filename": "raport_dzienny.pdf",
  "title": "Raport Sprzedaży",
  "content": "Dzisiaj sprzedaliśmy 100 produktów.\n\nPrzychód: 5000 PLN"
}
```

### Z wysyłką emailem:
```json
{
  "filename": "raport_dzienny.pdf",
  "title": "Raport Sprzedaży",
  "content": "Dzisiaj sprzedaliśmy 100 produktów.\n\nPrzychód: 5000 PLN",
  "send_email": true,
  "recipient": "szef@firma.pl",
  "email_subject": "Raport dzienny - dostępny do pobrania"
}
```

## Status:
- ✅ Backend kod gotowy
- ⏳ **WYMAGANE**: Utwórz bucket w Supabase (2 min)
- ⏳ **WYMAGANE**: Dodaj RLS policies (3 min)
- ✅ pdfkit zainstalowany
- ✅ Integracja z cronRoutes.ts

## Weryfikacja:

Po utworzeniu bucketu, backend będzie logował:
```
📄 Generating PDF: raport.pdf
✅ PDF uploaded to Supabase Storage: user_id/raport.pdf
🔗 PDF URL: https://cunuvyqkijgipctivghq.supabase.co/storage/v1/object/sign/...
📧 PDF link sent via email to recipient@example.com
```
