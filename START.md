# 🚀 START.md - Szybki Start dla Nowych Użytkowników

## Absolutne Minimum (5 minut)

### Krok 1: Pobierz Klucz API (DARMOWY)
1. Otwórz: https://aistudio.google.com/app/apikey
2. Zaloguj się przez Google
3. Kliknij "Create API key"
4. Skopiuj klucz

### Krok 2: Backend Setup
```powershell
# Windows PowerShell:
cd backend
Copy-Item .env.example .env

# Wygeneruj klucz szyfrowania:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Edytuj backend/.env i dodaj:
# AI_API_KEY=twój_klucz_gemini
# ENCRYPTION_KEY=wygenerowany_klucz

npm install
npm run dev
```

Powinno wyświetlić:
```
✅ Environment variables validated successfully
✅ All required directories initialized
🚀 Server is running on http://localhost:3001
```

### Krok 3: Frontend Setup
```powershell
# Nowy terminal:
cd frontend
npm install
npm run dev
```

### Krok 4: Test
Otwórz: http://localhost:3000

🎉 **Gotowe!**

---

## ❌ Jeśli coś nie działa

### "Missing required environment variable"
```powershell
cd backend
# Upewnij się że plik .env istnieje:
Get-Content .env

# Powinien zawierać:
# AI_API_KEY=...
# ENCRYPTION_KEY=...
```

### "Port already in use"
```powershell
# Zabij proces:
$port = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($port) { Stop-Process -Id $port.OwningProcess -Force }
```

### "Cannot find module"
```powershell
# Reinstaluj:
cd backend
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 📚 Więcej Informacji

- **Wszystkie funkcje:** `README.md`
- **Rozwiązywanie problemów:** `TROUBLESHOOTING.md`
- **Szybki start (EN):** `QUICKSTART.md`
- **Konfiguracja bazy danych:** `SUPABASE_SETUP.md`

---

## ✅ Co Działa Bez Konfiguracji

- ✅ AI Chat (Gemini)
- ✅ PDF Generator
- ✅ Web Scraper
- ✅ Scheduled Tasks (lokalnie)

## ⚠️ Co Wymaga Dodatkowej Konfiguracji

- ⚠️ Email (wymaga EMAIL_* variables)
- ⚠️ Baza danych (wymaga Supabase)
- ⚠️ Autentykacja użytkowników (wymaga Supabase)

---

## 💡 Pro Tip

**Używaj 2 terminali:**
1. Terminal 1: `cd backend && npm run dev` (zawsze pierwszy!)
2. Terminal 2: `cd frontend && npm run dev`

**Zawsze uruchamiaj backend PRZED frontendem!**
