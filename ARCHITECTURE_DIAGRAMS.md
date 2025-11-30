# 📊 Architecture Documentation Index

## UML Diagrams - Complete System Architecture

This project includes **world-class enterprise-level UML diagrams** documenting the entire system architecture.

### 📂 Location
All diagrams are located in: **`docs/uml-diagrams/`**

### 📖 Documentation
- **[Complete Documentation](docs/uml-diagrams/README.md)** - Comprehensive guide to all diagrams
- **[Image Generation Guide](docs/uml-diagrams/GENERATE_IMAGES.md)** - How to generate PNG/SVG/PDF from diagrams

### 🎯 Diagram Overview

| # | Diagram | Type | Description |
|---|---------|------|-------------|
| 1 | **Component Diagram** | Architecture | System components and dependencies |
| 2 | **Class Diagram** | Code Structure | Services, classes, interfaces, relationships |
| 3 | **Sequence Diagrams** | Behavior | 5 key operation flows (AI chat, email, PDF, scraping, cron) |
| 4 | **Deployment Diagram** | Infrastructure | Production environment and deployment architecture |
| 5 | **Database ERD** | Data Model | Complete database schema (16 tables) |
| 6 | **Use Case Diagram** | Functionality | System features and actors (45+ use cases) |

### 🚀 Quick Start

#### View in VS Code
1. Install **PlantUML** extension by jebbs
2. Open any `.puml` file in `docs/uml-diagrams/`
3. Press `Alt+D` to preview

#### Generate Images
```bash
cd docs/uml-diagrams
plantuml -tpng *.puml  # Generate PNG
plantuml -tsvg *.puml  # Generate SVG
```

### 🏆 Quality Standards

These diagrams follow:
- ✅ UML 2.5 Standard
- ✅ Enterprise Architecture Best Practices
- ✅ Clean Architecture Principles
- ✅ Software Engineering Excellence

### 🎨 Technologies Used

**Diagramming**: PlantUML  
**Format**: UML 2.5  
**Theme**: Vibrant (customizable)  
**Output**: PNG, SVG, PDF, EPS, LaTeX

### 📚 Learn More

Read the [complete documentation](docs/uml-diagrams/README.md) to understand:
- System architecture and design patterns
- Component relationships and data flows
- Deployment strategy and infrastructure
- Database schema and relationships
- All system features and use cases

---

**Note**: These diagrams are living documents. Update them as the codebase evolves!
