# 🧪 TEST LOKALNY - Szybkie Sprawdzenie

## Uruchom to PRZED commitem/deployem

### 1. Test Backend

```powershell
# Terminal 1 - Backend
cd backend

# Sprawdź czy .env istnieje
if (Test-Path .env) {
    Write-Host "✅ .env exists" -ForegroundColor Green
} else {
    Write-Host "❌ .env missing!" -ForegroundColor Red
    exit
}

# Sprawdź czy AI_API_KEY jest ustawiony
$envContent = Get-Content .env
if ($envContent -match "AI_API_KEY=.+") {
    Write-Host "✅ AI_API_KEY is set" -ForegroundColor Green
} else {
    Write-Host "❌ AI_API_KEY missing!" -ForegroundColor Red
    exit
}

# Uruchom
npm run dev
```

**Spodziewany output:**
```
✅ Environment variables validated successfully
✅ Configured: AI_API_KEY, ENCRYPTION_KEY
✅ All required directories initialized
🚀 Server is running on http://localhost:3001
📊 Environment: development
```

**Test API:**
```powershell
# Nowy terminal - test health check
Invoke-WebRequest -Uri "http://localhost:3001/health" | Select-Object -Expand Content
```

**Spodziewany output:**
```json
{"status":"ok","message":"Office Agent API is running"}
```

---

### 2. Test Frontend

```powershell
# Terminal 2 - Frontend
cd frontend

# Sprawdź czy backend działa
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not running!" -ForegroundColor Red
    exit
}

# Uruchom
npm run dev
```

**Spodziewany output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

**Test w przeglądarce:**
1. Otwórz: http://localhost:3000
2. Powinna załadować się strona główna
3. F12 (DevTools) - brak błędów w konsoli

---

### 3. Test AI Chat

**W przeglądarce:**
1. Przejdź do: http://localhost:3000/agent
2. Wpisz: "Hello! Test message."
3. Kliknij Send

**Spodziewany rezultat:**
- ✅ Wiadomość wysłana
- ✅ AI odpowiada (może chwilę potrwać)
- ✅ Brak błędów w konsoli

**W przypadku błędu sprawdź:**
- Backend logs (Terminal 1)
- Browser console (F12)
- Network tab (F12) - czy request do `/api/agent/chat` się udał

---

### 4. Test Environment Variables

```powershell
# Sprawdź backend env
cd backend
Get-Content .env | Select-String "AI_API_KEY","ENCRYPTION_KEY"
```

**Wymagane:**
```
AI_API_KEY=AIzaSy...
ENCRYPTION_KEY=a1b2c3d4e5f6...
```

```powershell
# Sprawdź frontend env (opcjonalne)
cd frontend
if (Test-Path .env.local) {
    Get-Content .env.local
}
```

---

### 5. Test Build (Production)

```powershell
# Backend build
cd backend
npm run build

# Sprawdź czy dist/ powstał
if (Test-Path dist/index.js) {
    Write-Host "✅ Backend build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Backend build failed!" -ForegroundColor Red
}
```

```powershell
# Frontend build
cd frontend
npm run build

# Sprawdź czy .next/ powstał
if (Test-Path .next) {
    Write-Host "✅ Frontend build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
}
```

---

### 6. Test TypeScript

```powershell
# Backend TypeScript check
cd backend
npx tsc --noEmit

# Brak outputu = sukces ✅
# Błędy = trzeba naprawić ❌
```

```powershell
# Frontend TypeScript check
cd frontend
npx tsc --noEmit

# Brak outputu = sukces ✅
```

---

### 7. Test Security

```powershell
# Sprawdź czy .env nie jest w git
cd ..
git status

# NIE POWINNO BYĆ:
# ❌ backend/.env
# ❌ frontend/.env.local

# POWINNO BYĆ:
# ✅ backend/.env.example
# ✅ frontend/.env.local.example
```

```powershell
# Sprawdź .gitignore
Get-Content .gitignore | Select-String "\.env"

# Powinno zawierać:
# .env
# .env*.local
# !.env.example
```

---

### 8. Test Directories

```powershell
cd backend

# Sprawdź czy katalogi istnieją
if (Test-Path uploads/attachments) {
    Write-Host "✅ uploads/attachments exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  uploads/attachments will be created on startup" -ForegroundColor Yellow
}
```

---

## ✅ PASS/FAIL Checklist

Po wszystkich testach:

- [ ] ✅ Backend startuje bez błędów
- [ ] ✅ Frontend startuje bez błędów
- [ ] ✅ Health check zwraca OK
- [ ] ✅ AI Chat odpowiada
- [ ] ✅ Build backend działa
- [ ] ✅ Build frontend działa
- [ ] ✅ TypeScript compile bez błędów
- [ ] ✅ .env nie jest w git status
- [ ] ✅ .gitignore zawiera .env
- [ ] ✅ Brak błędów w konsoli przeglądarki

**Jeśli wszystko ✅ - możesz commitować i deployować!** 🚀

**Jeśli coś ❌ - przeczytaj `TROUBLESHOOTING.md`** 🔧

---

## 🆘 Quick Fixes

### "Port already in use"
```powershell
$port = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($port) { Stop-Process -Id $port.OwningProcess -Force }
```

### "Module not found"
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### "Cannot find .env"
```powershell
Copy-Item .env.example .env
# Potem edytuj .env ręcznie
```

### "AI not responding"
- Sprawdź AI_API_KEY w .env
- Sprawdź limity API (15 req/min dla free tier)
- Sprawdź backend logs

---

## 📊 Performance Test

```powershell
# Test czasu odpowiedzi API
Measure-Command {
    Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
} | Select-Object TotalMilliseconds

# Powinno być < 100ms ✅
```

---

## 🎯 Final Check

```powershell
# Jeden command do sprawdzenia wszystkiego
Write-Host "=== FINAL CHECK ===" -ForegroundColor Cyan

# 1. Backend
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health"
    if ($health.status -eq "ok") {
        Write-Host "✅ Backend OK" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend FAIL" -ForegroundColor Red
}

# 2. Frontend
try {
    $fe = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
    if ($fe.StatusCode -eq 200) {
        Write-Host "✅ Frontend OK" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend FAIL" -ForegroundColor Red
}

# 3. Git
$gitStatus = git status --porcelain | Select-String "\.env$"
if ($gitStatus) {
    Write-Host "❌ .env in git!" -ForegroundColor Red
} else {
    Write-Host "✅ .env not in git" -ForegroundColor Green
}

Write-Host "=== END CHECK ===" -ForegroundColor Cyan
```

**Wszystko ✅ = Ready to Ship! 🚢**
