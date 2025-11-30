# 🚀 Quick Start - Viewing UML Diagrams

## ⚡ Fastest Way (3 steps, 1 minute)

### 1. Install VS Code Extension
```
Extensions → Search "PlantUML" → Install (by jebbs)
```

### 2. Open Any Diagram
```
docs/uml-diagrams/01-component-diagram.puml
```

### 3. Press Alt+D
```
Alt+D (Windows/Linux)
Option+D (Mac)
```

**That's it!** 🎉 You'll see the diagram rendered live.

---

## 📊 All Available Diagrams

### 1. Component Diagram
**File**: `01-component-diagram.puml`  
**Shows**: System architecture, layers, components, external integrations  
**Best for**: Understanding overall structure

### 2. Class Diagram
**File**: `02-class-diagram.puml`  
**Shows**: Services, classes, methods, relationships  
**Best for**: Code structure understanding

### 3. Sequence Diagrams
**File**: `03-sequence-diagrams.puml`  
**Shows**: 5 key operation flows with detailed interactions  
**Best for**: Understanding how system works at runtime

### 4. Deployment Diagram
**File**: `04-deployment-diagram.puml`  
**Shows**: Production infrastructure, servers, deployment options  
**Best for**: DevOps, deployment planning

### 5. Database ERD
**File**: `05-database-erd.puml`  
**Shows**: 16 tables, relationships, indexes, RLS policies  
**Best for**: Database design, queries optimization

### 6. Use Case Diagram
**File**: `06-use-case-diagram.puml`  
**Shows**: 45+ use cases, actors, system features  
**Best for**: Feature overview, product planning

---

## 💾 Export to PNG/SVG

### In VS Code:
```
Right-click on diagram → "Export Current Diagram"
Choose format: PNG, SVG, PDF, EPS
```

### Command Line:
```bash
cd docs/uml-diagrams

# Install (one time)
npm install

# Generate PNG
plantuml -tpng *.puml

# Generate SVG (better quality)
plantuml -tsvg *.puml
```

---

## 🌐 No Installation? Use Online!

### Option 1: PlantText
1. Go to https://www.planttext.com/
2. Copy content from `.puml` file
3. Paste and click "Refresh"
4. Right-click image → "Save As"

### Option 2: PlantUML Server
1. Go to http://www.plantuml.com/plantuml/uml/
2. Paste diagram code
3. View rendered diagram

---

## 📖 Learn More

- **Full Documentation**: [`README.md`](README.md)
- **Image Generation Guide**: [`GENERATE_IMAGES.md`](GENERATE_IMAGES.md)
- **Implementation Summary**: [`IMPLEMENTATION_SUMMARY.md`](IMPLEMENTATION_SUMMARY.md)

---

## 🎯 Recommended Reading Order

1. Start with **Component Diagram** (big picture)
2. Then **Use Case Diagram** (features)
3. Then **Sequence Diagrams** (how it works)
4. Then **Class Diagram** (code structure)
5. Then **Database ERD** (data model)
6. Finally **Deployment Diagram** (infrastructure)

---

## ❓ FAQ

**Q: Do I need Java?**  
A: No, if you use VS Code extension or online tools.

**Q: Can I edit these diagrams?**  
A: Yes! Just edit the `.puml` files and preview updates live.

**Q: How do I change colors/theme?**  
A: Change `!theme vibrant` to `!theme bluegray` (or other themes) in `.puml` file.

**Q: Can I use these in presentations?**  
A: Yes! Export to SVG for best quality in presentations.

**Q: Are these diagrams up to date?**  
A: Yes, created 2024-11-30 based on current codebase. Update them as code evolves.

---

## 🏆 What You'll Learn

By studying these diagrams you'll understand:
- ✅ Multi-tier architecture design
- ✅ Service-oriented architecture
- ✅ AI integration patterns
- ✅ RESTful API design
- ✅ Database schema design
- ✅ Deployment strategies
- ✅ Enterprise best practices

---

**Need help?** Check the full documentation in [`README.md`](README.md)

**Happy Learning!** 🚀📊
