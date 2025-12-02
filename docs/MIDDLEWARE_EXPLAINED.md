# 🛡️ Middleware Pipeline - Wyjaśnienie

## 📋 Spis Treści
1. [Co to jest Middleware?](#co-to-jest-middleware)
2. [Pipeline Flow](#pipeline-flow)
3. [Szczegółowe Wyjaśnienie Każdego Middleware](#szczegółowe-wyjaśnienie)
4. [Error Handler](#error-handler)
5. [Przykład Request Flow](#przykład-request-flow)

---

## Co to jest Middleware?

**Middleware** to funkcje, które przetwarzają request **zanim** trafi do route handler (controller/service).

### 🔄 Analogia: Kontrola Bezpieczeństwa na Lotnisku
```
Pasażer (Request)
    ↓
1. Kontrola biletów (Auth) ✅
    ↓
2. Skaner bagażu (Validation) ✅
    ↓
3. Kontrola paszportowa (Rate Limit) ✅
    ↓
4. Bramka (Route Handler) 🎯
    ↓
Samolot (Response)
```

Jeśli którykolwiek krok się nie powiedzie → **Error Handler** przejmuje kontrolę.

---

## Pipeline Flow

### 🔄 Sekwencja Middleware (9 kroków)

```typescript
Request → 1️⃣ Helmet → 2️⃣ CORS → 3️⃣ Logger → 4️⃣ Rate Limit → 5️⃣ Auth → 6️⃣ Validation → 7️⃣ Upload → 8️⃣ asyncHandler → 9️⃣ Route Handler
                                                                                                                             ↓
                                                                                                                          (błąd?)
                                                                                                                             ↓
                                                                                                                    🚨 Error Handler
```

Każdy middleware wywołuje `next()` aby przejść do następnego. Jeśli nie wywołuje `next()` → request się zatrzymuje.

---

## Szczegółowe Wyjaśnienie

### 1️⃣ **Helmet** (Security Headers)

**Co robi:** Dodaje 13 nagłówków HTTP chroniących przed atakami

#### 📦 Nagłówki dodawane przez Helmet:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-XSS-Protection: 1; mode=block
X-Download-Options: noopen
X-Permitted-Cross-Domain-Policies: none
Referrer-Policy: no-referrer
Content-Security-Policy: default-src 'self'
```

#### 🛡️ Przed czym chroni:
- **XSS (Cross-Site Scripting)** - wstrzykiwanie JS
- **Clickjacking** - ukryte iframe'y
- **MIME Sniffing** - podszywanie się pod inny typ pliku
- **Man-in-the-Middle** - ataki na połączeniu HTTP

#### 💻 Kod:
```typescript
// backend/src/index.ts
import helmet from 'helmet';
app.use(helmet());
```

#### 📊 Przed vs Po:
```
❌ BEZ HELMET:
GET /api/agent HTTP/1.1
Response: 200 OK
(brak nagłówków bezpieczeństwa)

✅ Z HELMET:
GET /api/agent HTTP/1.1
Response: 200 OK
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=15552000
```

---

### 2️⃣ **CORS** (Cross-Origin Resource Sharing)

**Co robi:** Kontroluje, które domeny mogą wysyłać requesty do API

#### 🌐 Problem Same-Origin Policy:
```
Frontend: http://localhost:3000
Backend:  http://localhost:3001

❌ BEZ CORS: Przeglądarka blokuje request
   Error: "Access to fetch at 'http://localhost:3001' from origin 
           'http://localhost:3000' has been blocked by CORS policy"

✅ Z CORS: Przeglądarka zezwala
   Backend dodaje nagłówek: Access-Control-Allow-Origin: http://localhost:3000
```

#### 💻 Kod:
```typescript
// backend/src/index.ts
import cors from 'cors';

app.use(cors({
  origin: ['http://localhost:3000', 'https://your-production-domain.com'],
  credentials: true, // zezwala na cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));
```

#### 📊 Nagłówki CORS:
```http
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

#### 🔒 Zabezpieczenie:
- Tylko whitelisted domeny mogą wywołać API
- Inne domeny dostaną error 403 Forbidden
- Chroni przed nieautoryzowanym dostępem z innych stron

---

### 3️⃣ **Request Logger**

**Co robi:** Loguje wszystkie requesty z Correlation ID (UUID)

#### 💻 Kod:
```typescript
// backend/src/middleware/requestLogger.ts
import { v4 as uuidv4 } from 'uuid';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = uuidv4();
  req.correlationId = correlationId;
  
  logger.debug('Incoming request', {
    correlationId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  
  next();
};
```

#### 📊 Przykład Log:
```json
{
  "timestamp": "2025-12-02T14:30:15.123Z",
  "level": "DEBUG",
  "message": "Incoming request",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "method": "POST",
  "path": "/api/email",
  "ip": "127.0.0.1"
}
```

#### 🔍 Zalety Correlation ID:
- Możesz śledzić cały request przez cały system
- W error logach widzisz dokładnie, który request spowodował błąd
- Łatwe debugowanie w produkcji

---

### 4️⃣ **Rate Limiter** (DDoS Protection)

**Co robi:** Limituje liczbę requestów z jednego IP

#### 💻 Kod:
```typescript
// backend/src/index.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // maksymalnie 100 requestów
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
```

#### 📊 Nagłówki zwracane:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1701529815
```

#### 🛡️ Przed czym chroni:
- **DDoS Attack** - przeciążenie serwera requestami
- **Brute Force** - próby złamania hasła (100 prób/15min max)
- **API Abuse** - nadużywanie darmowego API

#### ⚠️ Co się dzieje po przekroczeniu limitu:
```json
HTTP 429 Too Many Requests
{
  "success": false,
  "message": "Too many requests from this IP, please try again later"
}
```

---

### 5️⃣ **Auth (JWT)** (Authentication)

**Co robi:** Weryfikuje JWT token z Supabase

#### 💻 Kod:
```typescript
// backend/src/middleware/auth.ts
import { createClient } from '@supabase/supabase-js';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  req.user = user; // dodajemy user do request
  next();
};
```

#### 📊 Request Flow:
```
1. Frontend: localStorage.getItem('supabase.auth.token')
   → "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

2. Frontend: axios.get('/api/email', {
     headers: { Authorization: `Bearer ${token}` }
   })

3. Backend Auth Middleware: Weryfikuje token z Supabase
   ✅ Token valid → req.user = { id: 'xxx', email: 'user@email.com' }
   ❌ Token invalid → 401 Unauthorized

4. Route Handler: ma dostęp do req.user
```

#### 🔒 Co jest weryfikowane:
- Czy token jest ważny (nie wygasł)
- Czy token jest podpisany przez Supabase
- Czy user nadal istnieje w bazie

---

### 6️⃣ **Validation (Zod)** (Schema Validation)

**Co robi:** Waliduje body/params/query według schema Zod

#### 💻 Kod:
```typescript
// backend/src/middleware/validation.ts
import { z } from 'zod';

const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export const validateEmail = (req: Request, res: Response, next: NextFunction) => {
  const result = emailSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      message: 'Validation error',
      errors: result.error.flatten(),
    });
  }
  
  next();
};

// Użycie:
router.post('/api/email', validateEmail, emailController);
```

#### 📊 Przykład Error:
```json
POST /api/email
Body: {
  "to": "invalid-email",
  "subject": "",
  "body": "Hello"
}

Response: 400 Bad Request
{
  "message": "Validation error",
  "errors": {
    "to": ["Invalid email"],
    "subject": ["String must contain at least 1 character(s)"]
  }
}
```

#### ✅ Zalety:
- Brak invalid data w bazie
- Jasne error messages dla użytkownika
- Type-safe (TypeScript wie, co jest w req.body)

---

### 7️⃣ **Upload (Multer)** (File Upload)

**Co robi:** Obsługuje upload plików (PDF, images, attachments)

#### 💻 Kod:
```typescript
// backend/src/middleware/upload.ts
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: './uploads/pdfs/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const uploadPDF = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  },
});

// Użycie:
router.post('/api/pdf', uploadPDF.single('file'), pdfController);
```

#### 📊 Request:
```http
POST /api/pdf HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

(binary PDF data)
------WebKitFormBoundary--
```

#### 🔒 Zabezpieczenia:
- Limit rozmiaru (10MB)
- Whitelist MIME types (tylko PDF)
- Sanitizacja nazwy pliku
- Separate folder (./uploads/pdfs/)

---

### 8️⃣ **asyncHandler** (Error Forwarding)

**Co robi:** Automatycznie łapie błędy z async funkcji i przekazuje do Error Handler

#### 💻 Kod:
```typescript
// backend/src/middleware/errorHandler.ts
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

#### 📊 Użycie:
```typescript
// ❌ BEZ asyncHandler:
router.get('/api/email', async (req, res) => {
  try {
    const emails = await emailService.getEmails();
    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Z asyncHandler:
router.get('/api/email', asyncHandler(async (req, res) => {
  const emails = await emailService.getEmails();
  res.json(emails);
}));
// Jeśli błąd → automatycznie trafia do Error Handler
```

#### 🎯 Zalety:
- Brak powtarzalnego try/catch w każdym route
- Centralne error handling
- Mniej kodu (DRY principle)

---

### 9️⃣ **Error Handler** (Global Error Catcher)

**Co robi:** Łapie wszystkie błędy z całego pipeline i zwraca formatted JSON response

#### 💻 Kod:
```typescript
// backend/src/middleware/errorHandler.ts
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  
  // Handle known application errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  
  // Handle Supabase errors
  if (err.name === 'PostgrestError') {
    statusCode = 400;
    message = 'Database operation failed';
  }
  
  // Handle axios errors (External API)
  if ((err as any).isAxiosError) {
    statusCode = 502;
    message = 'External API request failed';
  }
  
  // Log errors
  console.error('❌ Error:', { message: err.message, stack: err.stack });
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
```

#### 📊 Typy błędów obsługiwane:

**1. Application Errors (AppError)**
```typescript
throw new AppError('Email not found', 404);
→ 404 Not Found { message: 'Email not found' }
```

**2. Database Errors (PostgrestError)**
```typescript
await supabase.from('emails').select('*').eq('id', 'invalid-uuid');
→ 400 Bad Request { message: 'Database operation failed' }
```

**3. External API Errors (Axios)**
```typescript
await axios.post('https://api.gemini.com/...');
→ 502 Bad Gateway { message: 'External API request failed' }
```

**4. Unknown Errors**
```typescript
throw new Error('Something went wrong');
→ 500 Internal Server Error { message: 'Internal Server Error' }
```

#### 🔍 Logging:
- **Development:** Full stack trace
- **Production:** Only critical errors logged (no sensitive data)

---

## Przykład Request Flow

### 📨 Pełny Przykład: POST /api/email

```typescript
1️⃣ HELMET
   → Dodaje nagłówki bezpieczeństwa
   ✅ X-Content-Type-Options: nosniff
   ✅ X-Frame-Options: DENY
   → next()

2️⃣ CORS
   → Sprawdza origin: http://localhost:3000
   ✅ Origin whitelisted
   → Dodaje: Access-Control-Allow-Origin: http://localhost:3000
   → next()

3️⃣ REQUEST LOGGER
   → Generuje Correlation ID: "a1b2c3d4-..."
   → Log: "Incoming request POST /api/email"
   → next()

4️⃣ RATE LIMITER
   → Sprawdza IP: 127.0.0.1
   → Counter: 45/100 requests in 15min
   ✅ Under limit
   → Dodaje: X-RateLimit-Remaining: 55
   → next()

5️⃣ AUTH (JWT)
   → Czyta: Authorization: Bearer eyJhbGciOi...
   → Weryfikuje token z Supabase
   ✅ Token valid
   → req.user = { id: 'xxx', email: 'user@example.com' }
   → next()

6️⃣ VALIDATION (Zod)
   → Waliduje req.body według emailSchema
   ✅ { to: 'test@example.com', subject: 'Hello', body: 'World' }
   → next()

7️⃣ UPLOAD (Multer)
   → Nie ma pliku w request
   → Skip (nie wymagany dla tego route)
   → next()

8️⃣ ASYNCHANDLER + ROUTE HANDLER
   → Wywołuje: emailService.sendEmail(req.body)
   → Service rzuca błąd: throw new AppError('SMTP connection failed', 502)
   → asyncHandler łapie błąd: .catch(next)
   → Przekazuje do Error Handler: next(error)

9️⃣ ERROR HANDLER
   → Otrzymuje: AppError { statusCode: 502, message: 'SMTP connection failed' }
   → Log: "❌ Error: SMTP connection failed"
   → Response:
      HTTP 502 Bad Gateway
      {
        "success": false,
        "message": "SMTP connection failed"
      }
```

---

## 🎯 Podsumowanie

### Dlaczego Middleware Pipeline?

✅ **Separation of Concerns** - każdy middleware ma jedną odpowiedzialność  
✅ **Reusable** - używasz tego samego middleware na wszystkich routes  
✅ **Testable** - każdy middleware testowany osobno  
✅ **Maintainable** - łatwo dodać/usunąć middleware  
✅ **Secure** - warstwy zabezpieczeń (defense in depth)  

### Kolejność ma znaczenie!

❌ **ZŁA kolejność:**
```typescript
app.use(auth);        // Najpierw auth
app.use(rateLimit);   // Potem rate limit
// Problem: Auth sprawdza token PRZED rate limitem
// → Atakujący może wysłać miliony requestów z invalid tokenem
```

✅ **DOBRA kolejność:**
```typescript
app.use(rateLimit);   // Najpierw rate limit
app.use(auth);        // Potem auth
// ✓ Rate limit blokuje atakującego PRZED weryfikacją tokena
```

### Diagram Flow:

```
                    ┌─────────────┐
                    │   REQUEST   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   HELMET    │ Security Headers
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    CORS     │ Cross-Origin Control
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   LOGGER    │ Correlation ID
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ RATE LIMIT  │ DDoS Protection
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    AUTH     │ JWT Verify
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ VALIDATION  │ Schema Check
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   UPLOAD    │ File Upload
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ ASYNC WRAP  │ Error Catcher
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ROUTE HANDLER│ Business Logic
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  RESPONSE   │
                    └─────────────┘
                           
                    (jeśli błąd ↓)
                           
                    ┌──────▼──────┐
                    │ERROR HANDLER│ Global Catch
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ERROR RESPONSE│
                    └─────────────┘
```

---

## 📚 Dodatkowe Zasoby

- **Express Middleware Guide:** https://expressjs.com/en/guide/using-middleware.html
- **Helmet Documentation:** https://helmetjs.github.io/
- **CORS Explained:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- **Rate Limiting Best Practices:** https://www.cloudflare.com/learning/bots/what-is-rate-limiting/
- **JWT Authentication:** https://jwt.io/introduction

---

**Utworzono:** 2025-12-02  
**Autor:** GitHub Copilot (Senior-level explanation)  
**Projekt:** The Office AI Agent
