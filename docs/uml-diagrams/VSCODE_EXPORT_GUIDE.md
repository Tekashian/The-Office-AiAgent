# 🎨 Szybki Przewodnik - Generowanie Diagramów w VS Code

## ✅ Masz już zainstalowane PlantUML Extension!

### Metoda 1: Podgląd i Export dla Pojedynczego Diagramu

1. **Otwórz dowolny diagram**
   ```
   Kliknij na plik w VS Code:
   - 01-component-diagram.puml
   - 02-class-diagram.puml
   - 03-sequence-diagrams.puml
   - 04-deployment-diagram.puml
   - 05-database-erd.puml
   - 06-use-case-diagram.puml
   ```

2. **Zobacz podgląd na żywo**
   ```
   Naciśnij: Alt + D (Windows/Linux)
   Lub: Option + D (Mac)
   ```
   
3. **Exportuj do PNG/SVG**
   ```
   Kliknij prawym przyciskiem na pliku .puml
   → Wybierz "PlantUML: Export Current Diagram"
   → Wybierz format: PNG, SVG, PDF, EPS
   ```

### Metoda 2: Export Wszystkich Diagramów Naraz

**Kliknij prawym przyciskiem na katalogu `docs/uml-diagrams/`**
```
→ "PlantUML: Export Workspace Diagrams"
→ Wybierz format (PNG zalecane)
```

To wygeneruje wszystkie 6 diagramów automatycznie!

### Metoda 3: Command Palette

```
Ctrl + Shift + P (Windows/Linux)
Cmd + Shift + P (Mac)

Wpisz: "PlantUML: Export"
Wybierz opcję eksportu
```

## 📊 Dostępne Formaty

| Format | Rozszerzenie | Zalecane Do | Jakość |
|--------|-------------|-------------|--------|
| PNG | .png | Dokumentacja, GitHub | ⭐⭐⭐⭐ |
| SVG | .svg | Prezentacje, Scalable | ⭐⭐⭐⭐⭐ |
| PDF | .pdf | Druk, Archiwum | ⭐⭐⭐⭐⭐ |
| EPS | .eps | Publikacje | ⭐⭐⭐⭐ |

## 🎯 Po Wygenerowaniu

Pliki pojawią się w tym samym katalogu:
```
docs/uml-diagrams/
├── 01-component-diagram.puml
├── 01-component-diagram.png        ← Nowy!
├── 02-class-diagram.puml
├── 02-class-diagram.png            ← Nowy!
└── ...
```

## 💡 Pro Tips

**Automatyczne Preview:**
- Ustawienia VS Code → PlantUML → Preview: Auto Update = true
- Każda zmiana w .puml automatycznie odświeża preview!

**Zmiana Tematu:**
- W pliku .puml zmień: `!theme vibrant` → `!theme bluegray`
- Dostępne: vibrant, bluegray, plain, cerulean, sandstone

**Lepsza Jakość:**
- Settings → PlantUML → Export: Format = SVG
- Settings → PlantUML → Export: Scale = 2.0

## 🚀 Quick Actions

**Szybkie Export wszystkich do PNG:**
```
1. Kliknij prawym na katalogu docs/uml-diagrams/
2. "PlantUML: Export Workspace Diagrams"
3. Wybierz PNG
4. Gotowe! ✅
```

**Szybkie Preview:**
```
1. Otwórz 01-component-diagram.puml
2. Alt + D
3. Zobacz piękny diagram! 🎨
```

## ❓ Troubleshooting

**Problem: "Java not found"**
- Rozszerzenie używa wbudowanego serwera PlantUML
- Powinno działać od razu, nie wymaga Java!

**Problem: Preview nie działa**
- Sprawdź czy plik ma rozszerzenie .puml
- Sprawdź czy rozszerzenie jest aktywne (dolny prawy róg VS Code)

**Problem: Export jest szary (niedostępny)**
- Upewnij się że plik .puml jest otwarty w edytorze
- Spróbuj przez Command Palette (Ctrl+Shift+P)

## 🎉 Gotowe!

Teraz możesz:
- ✅ Przeglądać wszystkie 6 diagramów
- ✅ Exportować do PNG/SVG/PDF
- ✅ Edytować i widzieć zmiany live
- ✅ Użyć w prezentacjach i dokumentacji

**Miłego przeglądania! 🚀📊**
