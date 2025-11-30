# Generowanie Obrazków z Diagramów UML

## 🎨 Metody Generowania

### Metoda 1: Visual Studio Code (Najłatwiejsza)

1. **Zainstaluj rozszerzenie PlantUML**
   - Otwórz VS Code
   - Przejdź do Extensions (`Ctrl+Shift+X`)
   - Wyszukaj "PlantUML" (autor: jebbs)
   - Kliknij Install

2. **Podgląd na żywo**
   - Otwórz dowolny plik `.puml`
   - Naciśnij `Alt+D` (Windows/Linux) lub `Option+D` (Mac)
   - Diagram pojawi się w oknie podglądu

3. **Eksport do PNG/SVG**
   - Kliknij prawym przyciskiem na pliku `.puml`
   - Wybierz "Export Current Diagram"
   - Wybierz format: PNG, SVG, PDF, etc.

### Metoda 2: Command Line (Node.js)

```bash
# Instalacja narzędzia
npm install -g node-plantuml

# Przejdź do katalogu z diagramami
cd docs/uml-diagrams

# Wygeneruj wszystkie diagramy do PNG
plantuml -tpng *.puml

# Wygeneruj do SVG (lepsza jakość, skalowalne)
plantuml -tsvg *.puml

# Wygeneruj pojedynczy plik
plantuml -tpng 01-component-diagram.puml

# Wygeneruj z określoną rozdzielczością
plantuml -tpng -DPLANTUML_LIMIT_SIZE=8192 *.puml
```

### Metoda 3: PlantUML JAR (Wymaga Java)

```bash
# Pobierz PlantUML JAR
# https://plantuml.com/download

# Wygeneruj diagramy
java -jar plantuml.jar *.puml

# Z wyższą jakością
java -DPLANTUML_LIMIT_SIZE=8192 -jar plantuml.jar *.puml

# Do SVG
java -jar plantuml.jar -tsvg *.puml
```

### Metoda 4: Online (Bez Instalacji)

1. Otwórz [PlantText](https://www.planttext.com/)
2. Skopiuj zawartość pliku `.puml`
3. Wklej do edytora
4. Kliknij "Refresh"
5. Kliknij prawym na obrazku → "Save Image As..."

### Metoda 5: Docker (Dla Zaawansowanych)

```bash
# Uruchom PlantUML w Dockerze
docker run -d -p 8080:8080 plantuml/plantuml-server:jetty

# Otwórz przeglądarkę: http://localhost:8080
# Wklej kod diagramu i wygeneruj
```

## 📏 Zalecane Ustawienia Jakości

### Dla Prezentacji
```bash
# SVG - najlepsza jakość, skalowalne
plantuml -tsvg *.puml
```

### Dla Dokumentacji
```bash
# PNG - dobra jakość, uniwersalne
plantuml -tpng -DPLANTUML_LIMIT_SIZE=8192 *.puml
```

### Dla Druku
```bash
# PDF - wysoka jakość druku
plantuml -tpdf *.puml
```

## 🚀 Automatyczne Generowanie (CI/CD)

### GitHub Actions

Utwórz plik `.github/workflows/generate-diagrams.yml`:

```yaml
name: Generate UML Diagrams

on:
  push:
    paths:
      - 'docs/uml-diagrams/*.puml'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Generate diagrams
        uses: grassedge/generate-plantuml-action@v1.5
        with:
          path: docs/uml-diagrams
          message: "Regenerate PlantUML diagrams"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### NPM Script

Dodaj do `package.json`:

```json
{
  "scripts": {
    "diagrams:generate": "plantuml -tpng docs/uml-diagrams/*.puml",
    "diagrams:svg": "plantuml -tsvg docs/uml-diagrams/*.puml",
    "diagrams:watch": "plantuml -watchinterval 1 docs/uml-diagrams/*.puml"
  }
}
```

Użycie:
```bash
npm run diagrams:generate
npm run diagrams:svg
npm run diagrams:watch  # Auto-regeneracja przy zapisie
```

## 🎯 Struktura Wygenerowanych Plików

Po wygenerowaniu otrzymasz:

```
docs/uml-diagrams/
├── 01-component-diagram.puml
├── 01-component-diagram.png        ← Wygenerowany
├── 02-class-diagram.puml
├── 02-class-diagram.png            ← Wygenerowany
├── 03-sequence-diagrams.puml
├── 03-sequence-diagrams.png        ← Wygenerowany
├── 04-deployment-diagram.puml
├── 04-deployment-diagram.png       ← Wygenerowany
├── 05-database-erd.puml
├── 05-database-erd.png             ← Wygenerowany
├── 06-use-case-diagram.puml
├── 06-use-case-diagram.png         ← Wygenerowany
└── README.md
```

## 🔧 Troubleshooting

### Problem: "Diagram too big"

**Rozwiązanie**:
```bash
# Zwiększ limit rozmiaru
plantuml -DPLANTUML_LIMIT_SIZE=16384 *.puml

# Lub w pliku .puml dodaj na początku:
!pragma scale max 8192
```

### Problem: "Java not found"

**Rozwiązanie dla node-plantuml**:
```bash
# Zainstaluj Graphviz (wymagane przez PlantUML)
# Windows (Chocolatey):
choco install graphviz

# MacOS (Homebrew):
brew install graphviz

# Linux (Ubuntu):
sudo apt-get install graphviz
```

### Problem: Polskie znaki nie wyświetlają się

**Rozwiązanie**:
```bash
# Dodaj na początku pliku .puml:
skinparam defaultFontName Arial Unicode MS

# Lub:
skinparam defaultFontName DejaVu Sans
```

### Problem: Zbyt mały tekst

**Rozwiązanie**:
```bash
# Dodaj na początku:
skinparam defaultFontSize 14
skinparam classFontSize 12
skinparam componentFontSize 12
```

## 📊 Formaty Wyjściowe

| Format | Rozszerzenie | Zalecane Do | Rozmiar | Jakość |
|--------|-------------|-------------|---------|--------|
| PNG | `.png` | Dokumentacja, Web | Średni | Dobra |
| SVG | `.svg` | Prezentacje, Web | Mały | Doskonała |
| PDF | `.pdf` | Druk, Archiwum | Duży | Doskonała |
| EPS | `.eps` | Publikacje naukowe | Średni | Doskonała |
| LaTeX | `.latex` | Dokumenty LaTeX | Mały | Doskonała |

## 🎨 Customizacja Wyglądu

### Zmiana Motywu

W plikach `.puml` zmień:
```plantuml
!theme vibrant    → !theme bluegray
                  → !theme plain
                  → !theme cerulean
                  → !theme sandstone
```

Dostępne motywy: https://plantuml.com/theme

### Zmiana Kolorów

```plantuml
skinparam backgroundColor #EEEBDC
skinparam componentBackgroundColor lightblue
skinparam componentBorderColor darkblue
```

### Zmiana Czcionki

```plantuml
skinparam defaultFontName Courier
skinparam defaultFontSize 12
skinparam defaultFontStyle bold
```

## ✅ Checklist Przed Publikacją

- [ ] Wszystkie diagramy wygenerowane do PNG
- [ ] Wygenerowano wersje SVG dla prezentacji
- [ ] Sprawdzono poprawność wszystkich diagramów
- [ ] Zaktualizowano README jeśli zmieniła się architektura
- [ ] Pliki `.puml` są w kontroli wersji (Git)
- [ ] Wygenerowane `.png/.svg` są w `.gitignore` (opcjonalnie)

## 🔗 Przydatne Linki

- [PlantUML Official](https://plantuml.com/)
- [PlantUML Component Diagram](https://plantuml.com/component-diagram)
- [PlantUML Class Diagram](https://plantuml.com/class-diagram)
- [PlantUML Sequence Diagram](https://plantuml.com/sequence-diagram)
- [PlantUML Deployment Diagram](https://plantuml.com/deployment-diagram)
- [PlantUML Themes](https://plantuml.com/theme)
- [PlantUML Skinparam](https://plantuml-documentation.readthedocs.io/en/latest/formatting/all-skin-params.html)

---

**Pro Tip**: Używaj `plantuml -watchinterval 1 *.puml` podczas edycji - automatycznie regeneruje diagramy przy każdej zmianie!
