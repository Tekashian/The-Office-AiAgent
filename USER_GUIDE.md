# 🎯 Przewodnik Użytkownika - Office AI Agent

## Wprowadzenie

Office AI Agent to inteligentny system automatyzacji zadań biurowych. Ten przewodnik pomoże Ci w pełni wykorzystać możliwości aplikacji.

## 🚀 Pierwsze kroki

### 1. Konfiguracja

Po pierwszym uruchomieniu przejdź do **Settings** i skonfiguruj:

- **API Keys** - klucze do AI API (OpenAI, Anthropic, etc.)
- **Email SMTP** - dane do wysyłki emaili
- **Supabase** - połączenie z bazą danych

### 2. Dashboard

Dashboard to Twój główny hub. Znajdziesz tam:
- 📊 **Statystyki** - aktywne zadania, ukończone, błędy
- 📝 **Ostatnie zadania** - historia aktywności
- ⚡ **Quick actions** - szybki dostęp do funkcji

## 💬 Jak używać AI Agent Chat

### Podstawowe komendy

1. **Wyślij email**
   ```
   Wyślij email do zespołu z raportem miesięcznym
   ```

2. **Wygeneruj PDF**
   ```
   Stwórz fakturę VAT dla klienta XYZ na kwotę 1500 zł
   ```

3. **Web Scraping**
   ```
   Zbierz cennik produktów ze strony konkurencji.pl
   ```

4. **Zaplanuj zadanie**
   ```
   Co poniedziałek o 9:00 wyślij raport sprzedaży do managera
   ```

### Zaawansowane funkcje

**Context awareness** - Agent pamięta kontekst rozmowy:
```
User: Wygeneruj raport sprzedaży za październik
Agent: Raport został wygenerowany
User: Teraz wyślij go do dyrektora
Agent: Email z raportem został wysłany
```

**Multi-step tasks** - Zadania wieloetapowe:
```
1. Zbierz dane z strony
2. Przeanalizuj je
3. Stwórz raport PDF
4. Wyślij emailem
```

## 📧 Email Automation

### Tworzenie nowego emaila

1. Przejdź do zakładki **Email**
2. Wypełnij formularz:
   - **Odbiorcy** - adresy email (oddzielone przecinkami)
   - **Temat** - tytuł wiadomości
   - **Treść** - wiadomość (możesz użyć AI do wygenerowania)
3. Opcjonalnie dodaj załączniki
4. **Wyślij teraz** lub **Zaplanuj** na później

### Szablony emaili

Stwórz własne szablony dla często używanych wiadomości:
- Raport miesięczny
- Oferta handlowa
- Potwierdzenie zamówienia
- Newsletter

### Bulk Email

Wyślij wiadomość do wielu odbiorców:
```
jan.kowalski@firma.pl, anna.nowak@firma.pl, team@firma.pl
```

## 📄 PDF Generator

### Typy dokumentów

1. **Faktura VAT**
   - Dane firmy
   - Pozycje
   - Podsumowanie
   - Automatyczne obliczenia

2. **Oferta handlowa**
   - Opis produktów/usług
   - Cennik
   - Warunki

3. **Raport**
   - Dane liczbowe
   - Wykresy
   - Wnioski

### AI-assisted generation

Użyj AI do wygenerowania treści:
```
Wygeneruj ofertę handlową dla firmy ABC:
- 5 licencji software
- Wsparcie techniczne 24/7
- Szkolenie dla 10 osób
```

## 🌐 Web Scraper

### Konfiguracja zadania

1. **URL strony** - adres do scrapowania
2. **Selektory CSS** (opcjonalne) - precyzyjne zbieranie danych
   ```css
   .product-name
   .product-price
   .product-description
   ```
3. **Częstotliwość**
   - Jednorazowo
   - Co godzinę
   - Codziennie
   - Co tydzień

### Przykłady użycia

**Monitoring cen konkurencji:**
```
URL: https://konkurencja.pl/produkty
Selektor: .price-tag
Częstotliwość: Codziennie o 8:00
```

**Zbieranie ofert pracy:**
```
URL: https://jobboard.pl/it
Selektor: .job-listing
Częstotliwość: Co 6 godzin
```

### Zaawansowane opcje

- ✅ **AI Processing** - automatyczna analiza zebranych danych
- ✅ **Powiadomienia** - alert po zakończeniu
- ✅ **Export** - zapis jako CSV/JSON

## ⏰ Scheduled Tasks (Cron)

### Wyrażenia Cron

| Wyrażenie | Opis | Przykład użycia |
|-----------|------|-----------------|
| `0 8 * * *` | Codziennie o 8:00 | Raport dzienny |
| `0 */6 * * *` | Co 6 godzin | Monitoring systemu |
| `0 0 * * 0` | Co niedzielę o północy | Backup |
| `*/15 * * * *` | Co 15 minut | Health check |
| `0 9 * * 1-5` | Dni robocze o 9:00 | Raport tygodniowy |

### Tworzenie zadania

1. Podaj **nazwę zadania**
2. Ustaw **wyrażenie cron**
3. Wybierz **typ zadania**:
   - Email
   - PDF Generation
   - Web Scraping
   - AI Request
4. Kliknij **Utwórz zadanie**

### Zarządzanie zadaniami

- ▶️ **Play/Pause** - wstrzymaj lub wznów
- 🗑️ **Delete** - usuń zadanie
- 📊 **Stats** - statystyki wykonań

## 🔧 Tips & Tricks

### 1. Kombinuj funkcje

```
Agent: Zbierz dane ze strony konkurencji
→ Wygeneruj raport PDF
→ Wyślij emailem do managera
```

### 2. Używaj szablonów

Twórz szablony dla powtarzalnych zadań:
- Faktury z automatyczną numeracją
- Raporty z aktualnymi danymi
- Emaile z personalizacją

### 3. Monitoruj statystyki

Regularnie sprawdzaj Dashboard:
- Ile zadań zostało wykonanych
- Czy są błędy
- Trendy aktywności

### 4. Optymalizuj Cron

Nie ustawiaj zbyt częstych zadań:
- ❌ `* * * * *` (co minutę) - zbyt często
- ✅ `*/15 * * * *` (co 15 minut) - rozsądnie

### 5. Testuj przed automatyzacją

Przed zaplanowaniem zadania:
1. Przetestuj ręcznie
2. Sprawdź wyniki
3. Dopiero wtedy automatyzuj

## 🆘 Rozwiązywanie problemów

### Email nie został wysłany

- ✅ Sprawdź konfigurację SMTP w Settings
- ✅ Dla Gmail - użyj hasła aplikacji (nie hasła konta)
- ✅ Sprawdź czy email nie trafił do SPAM

### PDF nie został wygenerowany

- ✅ Sprawdź czy treść jest poprawna
- ✅ Upewnij się że masz odpowiednie uprawnienia
- ✅ Sprawdź logi błędów

### Web Scraper nie zbiera danych

- ✅ Sprawdź czy URL jest poprawny
- ✅ Zweryfikuj selektory CSS
- ✅ Niektóre strony mogą blokować scraping

### Cron nie wykonuje się

- ✅ Sprawdź składnię wyrażenia cron
- ✅ Upewnij się że zadanie jest aktywne (nie wstrzymane)
- ✅ Sprawdź logi wykonań

## 📚 Dodatkowe zasoby

- **GitHub**: [The-Office-AiAgent](https://github.com/Tekashian/The-Office-AiAgent)
- **Cron Guru**: https://crontab.guru - generator wyrażeń cron
- **CSS Selectors**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors

## 🎓 Przykładowe scenariusze

### Scenariusz 1: Automatyczny raport sprzedaży

1. Ustaw cron: `0 8 * * 1` (każdy poniedziałek o 8:00)
2. Typ: AI Request
3. Zadanie: Zbierz dane sprzedaży → Wygeneruj PDF → Wyślij email

### Scenariusz 2: Monitoring konkurencji

1. Web Scraper: zbieraj ceny co 6h
2. AI Processing: analizuj zmiany
3. Email: powiadamiaj o istotnych zmianach

### Scenariusz 3: Automatyczne faktury

1. Szablon: Faktura VAT
2. AI: Uzupełnij dane
3. PDF: Wygeneruj dokument
4. Email: Wyślij do klienta

## 💡 Najlepsze praktyki

1. **Organizacja** - nazywaj zadania opisowo
2. **Monitorowanie** - regularnie sprawdzaj Dashboard
3. **Backup** - eksportuj ważne dane
4. **Testowanie** - przed automatyzacją przetestuj ręcznie
5. **Dokumentacja** - notuj konfiguracje zadań

---

**Powodzenia z automatyzacją! 🚀**

W razie pytań skorzystaj z AI Agent Chat - agent zawsze służy pomocą!
