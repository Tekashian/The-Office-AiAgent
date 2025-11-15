# 📬 AI Email Inbox - User Guide

## 🎯 **Czym jest AI Email Inbox?**

System automatycznego skanowania skrzynki odbiorczej z AI, który:
- 📥 **Pobiera** nieprzeczytane emaile z IMAP (Gmail, Outlook, etc.)
- 🤖 **Analizuje** je za pomocą AI (priorytet, kategoria, sentiment)
- ✍️ **Generuje** profesjonalne odpowiedzi automatycznie
- 👤 **Czeka** na Twoją akceptację przed wysłaniem

---

## 🚀 **Jak zacząć?**

### **Krok 1: Skonfiguruj IMAP**

1. Przejdź do **Settings → Email**
2. Dodaj konfigurację IMAP:

#### **Gmail:**
```
IMAP Host: imap.gmail.com
IMAP Port: 993
IMAP User: twoj@gmail.com
IMAP Password: [App Password - NIE hasło do konta!]
Use SSL: ✓ TAK
```

**⚠️ Ważne dla Gmail:**
- Włącz 2FA (weryfikacja dwuetapowa)
- Wygeneruj App Password: https://myaccount.google.com/apppasswords
- Użyj App Password zamiast zwykłego hasła

#### **Outlook/Office365:**
```
IMAP Host: outlook.office365.com
IMAP Port: 993
IMAP User: twoj@outlook.com
IMAP Password: [hasło do konta]
Use SSL: ✓ TAK
```

#### **Custom Server:**
```
IMAP Host: mail.yourdomain.com
IMAP Port: 993 (lub 143)
IMAP User: user@yourdomain.com
IMAP Password: [hasło]
Use SSL: ✓ dla 993, ✗ dla 143
```

3. Kliknij **Save**
4. System zaszyfruje hasło AES-256

---

### **Krok 2: Skanuj Inbox**

1. Przejdź do **AI Email Inbox** (w menu)
2. Kliknij **"Scan Inbox"**
3. System:
   - Połączy się z IMAP
   - Pobierze nieprzeczytane emaile
   - AI przeanalizuje każdy email
   - Wygeneruje AI draft odpowiedzi

**⏱️ Czas skanowania:** ~5-10 sekund dla 10 emaili

---

### **Krok 3: Przeglądaj Emaile**

Dashboard pokazuje:

#### **📊 Statystyki:**
- **Unread**: Liczba nieprzeczytanych emaili
- **Urgent**: Emaile oznaczone jako pilne przez AI
- **AI Drafts**: Gotowe odpowiedzi czekające na akceptację

#### **📧 Lista Emaili:**
- Każdy email pokazuje:
  - **Nadawca** (imię/email)
  - **Temat**
  - **AI Summary** (krótkie podsumowanie)
  - **Priority Badge** (urgent/high/normal/low)
  - **Kropka** 🔵 = nieprzeczytany

**Kolory priorytetów:**
- 🔴 **Urgent** - Wymaga natychmiastowej uwagi
- 🟠 **High** - Ważne
- 🔵 **Normal** - Standardowe
- ⚪ **Low** - Niski priorytet

---

### **Krok 4: Przeczytaj Email i AI Analizę**

Po kliknięciu na email zobaczysz:

#### **1. Original Email**
```
From: john@example.com
Subject: Urgent: Project deadline
Body: [treść emaila]
```

#### **2. AI Analysis**
```
✨ Summary: Client asking about project deadline extension
📁 Category: request
😊 Sentiment: neutral
💡 Suggested Action: reply
```

**Kategorie AI:**
- `question` - Pytanie wymagające odpowiedzi
- `request` - Prośba o coś
- `complaint` - Reklamacja/skarga
- `info` - Informacja (nie wymaga odpowiedzi)
- `spam` - Spam/niechciany email
- `other` - Inne

---

### **Krok 5: Sprawdź AI Draft Response**

AI automatycznie wygenerował odpowiedź:

```
✨ AI Generated Response
📊 Confidence: 85%

To: john@example.com
Subject: Re: Urgent: Project deadline

Body:
Dear John,

Thank you for reaching out regarding the project deadline...

[Professional AI-generated response]

Best regards,
[Your name]

💡 Reasoning: "Client is requesting information, professional 
tone appropriate, addresses all concerns mentioned"
```

---

### **Krok 6: Edytuj lub Wyślij**

#### **Opcja A: Wyślij bez zmian**
1. Przeczytaj draft
2. Jeśli OK → Kliknij **"Send Email"**
3. ✅ Email wysłany!

#### **Opcja B: Edytuj przed wysłaniem**
1. Kliknij **"Edit"**
2. Zmień treść w textarea
3. Kliknij **"Save Draft"**
4. Kliknij **"Send Email"**

#### **Opcja C: Odrzuć**
1. Kliknij **"Reject"**
2. Draft zostanie oznaczony jako odrzucony
3. Możesz odpowiedzieć ręcznie

---

## 🔄 **Automatyczne Skanowanie**

### **Włącz Auto-Scan:**
1. Settings → Email → IMAP Config
2. Zaznacz **"Auto Scan"**
3. Ustaw **"Scan Interval"** (np. 5 minut)
4. System będzie automatycznie skanował co X minut

### **⚠️ Uwagi:**
- Auto-scan wymaga, żeby backend był włączony
- Zalecany interval: 5-15 minut
- Zbyt częste skanowanie może spowolnić serwer

---

## 📊 **API Endpoints**

### **Backend Routes:**

```typescript
// IMAP Configuration
POST   /api/email-inbox/imap-config  // Save IMAP config
GET    /api/email-inbox/imap-config  // Get configs

// Inbox Management
POST   /api/email-inbox/scan         // Manual scan
GET    /api/email-inbox/emails       // List emails
GET    /api/email-inbox/emails/:id   // Get email details
PATCH  /api/email-inbox/emails/:id   // Mark read/starred

// AI Drafts
GET    /api/email-inbox/drafts       // List drafts
PATCH  /api/email-inbox/drafts/:id   // Edit draft
POST   /api/email-inbox/drafts/:id/send  // Send draft

// Statistics
GET    /api/email-inbox/stats        // Unread, urgent, drafts count
```

---

## 🎨 **Use Cases**

### **1. Customer Support**
```
Incoming: "Product is not working, need refund"
AI analyzes: Priority=urgent, Category=complaint, Sentiment=negative
AI generates: Apologetic response with solution steps
You: Edit to add specific details → Send
```

### **2. Business Inquiries**
```
Incoming: "What are your pricing plans?"
AI analyzes: Priority=high, Category=question, Sentiment=neutral
AI generates: Professional response with pricing info
You: Review → Send immediately
```

### **3. Meeting Requests**
```
Incoming: "Can we schedule a call next week?"
AI analyzes: Priority=normal, Category=request, Sentiment=positive
AI generates: Response suggesting available time slots
You: Adjust dates → Send
```

### **4. Newsletter/Info**
```
Incoming: "Weekly industry news..."
AI analyzes: Priority=low, Category=info, Sentiment=neutral
AI suggests: archive (no reply needed)
You: Archive
```

---

## 🔐 **Bezpieczeństwo**

### **Szyfrowanie:**
- IMAP passwords: **AES-256-CBC encrypted**
- SMTP passwords: **AES-256-CBC encrypted**
- Encryption key: Stored in `.env`

### **Row Level Security:**
- Każdy user widzi **tylko swoje** emaile
- RLS policies w Supabase
- Pełna izolacja danych

### **Best Practices:**
✅ Użyj App Passwords (Gmail)
✅ Włącz 2FA na koncie email
✅ Regularnie zmieniaj hasła
✅ Nie udostępniaj encryption key
✅ Backup bazy danych

---

## 🛠️ **Troubleshooting**

### **❌ "No IMAP configuration found"**
**Rozwiązanie:** Skonfiguruj IMAP w Settings → Email

### **❌ "IMAP connection failed"**
**Przyczyny:**
- Błędny host/port
- Złe hasło
- 2FA włączone (Gmail) - użyj App Password
- IMAP disabled w koncie email

**Rozwiązanie:**
1. Sprawdź credentials
2. Gmail: Wygeneruj App Password
3. Outlook: Sprawdź czy IMAP enabled

### **❌ "No emails found"**
**Przyczyny:**
- Brak nieprzeczytanych emaili
- Emaile już zaimportowane
- IMAP folder nie jest INBOX

**Rozwiązanie:** Użyj "Scan Inbox" ponownie

### **❌ "AI draft generation failed"**
**Przyczyny:**
- Gemini API key invalid
- Rate limit exceeded
- Email body empty

**Rozwiązanie:** Sprawdź `AI_API_KEY` w `.env`

---

## 📈 **Roadmap**

### **Planned Features:**
- [ ] Multi-folder support (Sent, Drafts, Spam)
- [ ] Email threading (conversation view)
- [ ] Attachment handling
- [ ] Template responses
- [ ] Bulk operations
- [ ] Email scheduling
- [ ] Smart filters
- [ ] Analytics dashboard

---

## 💡 **Tips & Tricks**

### **1. Train AI with feedback**
- Edit drafts before sending
- AI learns your style over time

### **2. Use filters**
- Filter by priority (urgent only)
- Filter by unread status
- Filter by category

### **3. Keyboard shortcuts** (future)
- `E` - Edit draft
- `S` - Send email
- `R` - Reject draft
- `N` - Next email

### **4. Batch processing**
- Scan inbox once daily
- Review all drafts
- Approve/Edit/Send in bulk

---

## 📞 **Support**

**Problemy?**
- Check logs: Backend console
- Database: Supabase Dashboard
- Frontend: Browser DevTools

**Need help?**
- GitHub Issues
- Documentation: `/docs`
