# ✅ Checklist Przed Deploy/Commit

## 🔒 BEZPIECZEŃSTWO

### Sprawdź pliki .env
- [ ] ❌ **NIE** commituj plików `.env` lub `.env.local`
- [ ] ✅ Sprawdź `.gitignore` - czy zawiera `.env`
- [ ] ✅ Commituj tylko `.env.example` pliki
- [ ] ✅ Upewnij się że `.env.example` nie zawiera prawdziwych kluczy

```bash
# Sprawdź co zostanie zacommitowane:
git status

# Jeśli widzisz .env - USUŃ go z staging:
git reset HEAD .env
git reset HEAD backend/.env
git reset HEAD frontend/.env.local
```

### Sprawdź logi
- [ ] ✅ Brak API keys w console.log
- [ ] ✅ Brak haseł w console.log
- [ ] ✅ Debug logi chronione przez `NODE_ENV !== 'production'`

### Sprawdź hardcoded wartości
```bash
# Szukaj podejrzanych wartości:
git grep -i "password.*=.*['\"]"
git grep -i "api.*key.*=.*['\"]"
git grep -i "secret.*=.*['\"]"
```

---

## 📦 PACKAGE.JSON

### Backend
- [ ] ✅ Wszystkie dependencies zainstalowane (`npm install` bez błędów)
- [ ] ✅ `npm run build` działa bez błędów
- [ ] ✅ `npm run dev` startuje poprawnie
- [ ] ✅ TypeScript kompiluje się bez błędów

### Frontend
- [ ] ✅ Wszystkie dependencies zainstalowane
- [ ] ✅ `npm run build` działa bez błędów
- [ ] ✅ `npm run dev` startuje poprawnie
- [ ] ✅ Brak warning o missing dependencies

---

## 🧪 TESTY FUNKCJONALNOŚCI

### Backend
- [ ] ✅ Health check działa: `curl http://localhost:3001/health`
- [ ] ✅ API uruchamia się bez błędów
- [ ] ✅ Walidacja env variables działa (testuj bez AI_API_KEY)
- [ ] ✅ Katalogi `uploads/attachments` tworzą się automatycznie

### Frontend
- [ ] ✅ Aplikacja uruchamia się na localhost:3000
- [ ] ✅ Połączenie z backendem działa
- [ ] ✅ Brak błędów w konsoli przeglądarki (F12)
- [ ] ✅ Routing działa (wszystkie strony dostępne)

### Integracja
- [ ] ✅ AI Chat odpowiada (wymaga AI_API_KEY)
- [ ] ✅ Wszystkie przyciski działają
- [ ] ✅ Brak 404 na API endpoints

---

## 📝 DOKUMENTACJA

### Pliki wymagane
- [ ] ✅ `README.md` - aktualny i kompletny
- [ ] ✅ `.env.example` dla backend i frontend
- [ ] ✅ `QUICKSTART.md` lub `START.md` - szybki start
- [ ] ✅ `TROUBLESHOOTING.md` - rozwiązywanie problemów

### Sprawdź czy dokumentacja zawiera:
- [ ] ✅ Wymagania systemowe (Node.js, npm)
- [ ] ✅ Instrukcje instalacji
- [ ] ✅ Jak uzyskać API keys
- [ ] ✅ Jak wygenerować ENCRYPTION_KEY
- [ ] ✅ Komendy uruchomieniowe
- [ ] ✅ Rozwiązywanie typowych problemów

---

## 🌐 DEPLOY (Produkcja)

### Zmienne Środowiskowe (Vercel/Heroku/etc)
- [ ] ✅ Wszystkie zmienne z `.env.example` ustawione
- [ ] ✅ `NODE_ENV=production`
- [ ] ✅ `FRONTEND_URL` ustawiony na prawdziwy URL
- [ ] ✅ `NEXT_PUBLIC_API_URL` ustawiony na backend URL
- [ ] ✅ ENCRYPTION_KEY zapisany bezpiecznie (nie commitowany!)

### Build
- [ ] ✅ Backend build działa: `npm run build`
- [ ] ✅ Frontend build działa: `npm run build`
- [ ] ✅ Brak TypeScript errors
- [ ] ✅ Brak dependency warnings

### Testing Production
- [ ] ✅ Health check: `https://your-api.com/health`
- [ ] ✅ CORS configured poprawnie
- [ ] ✅ Environment variables loaded
- [ ] ✅ Frontend łączy się z backendem

---

## 🚫 RED FLAGS - NIGDY NIE COMMITUJ

```bash
# Sprawdź czy przypadkowo nie commitowałeś:
git diff --cached | grep -i "api.*key"
git diff --cached | grep -i "password"
git diff --cached | grep -i "secret"
```

### ❌ NIE COMMITUJ:
- ❌ Plików `.env` (tylko `.env.example`)
- ❌ API keys w kodzie
- ❌ Haseł w kodzie
- ❌ Database credentials
- ❌ Private keys
- ❌ node_modules/
- ❌ dist/, build/, .next/
- ❌ Lokalnych plików testowych
- ❌ .DS_Store, Thumbs.db

---

## ✅ READY TO COMMIT

Jeśli wszystkie checklisty są ✅, możesz bezpiecznie commitować:

```bash
git add .
git commit -m "feat: add security improvements and documentation"
git push origin main
```

---

## 🆘 W Razie Wycieku

Jeśli przypadkowo commitowałeś wrażliwe dane:

```bash
# 1. Usuń plik z historii Git
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Force push (UWAGA: dla repo publicznych!)
git push origin --force --all

# 3. NATYCHMIAST zmień wszystkie klucze API!
# - Wygeneruj nowy AI_API_KEY
# - Wygeneruj nowy ENCRYPTION_KEY
# - Zmień hasła email
# - Rotuj wszystkie secrets
```

---

## 📊 Quality Checklist

### Code Quality
- [ ] ✅ Brak unused imports
- [ ] ✅ Brak console.error w produkcji (tylko w dev mode)
- [ ] ✅ Proper error handling
- [ ] ✅ TypeScript strict mode

### Performance
- [ ] ✅ Brak memory leaks
- [ ] ✅ Proper cleanup w useEffect (React)
- [ ] ✅ Brak infinite loops
- [ ] ✅ API timeouts configured

### UX
- [ ] ✅ Loading states
- [ ] ✅ Error messages user-friendly
- [ ] ✅ Success feedback
- [ ] ✅ Responsive design

---

**Pamiętaj: Lepiej poświęcić 10 minut na checklist niż godziny na naprawę wycieku!** 🔒
