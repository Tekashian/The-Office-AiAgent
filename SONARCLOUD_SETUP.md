# SonarCloud Setup Instructions

## 🔍 What is SonarCloud?

SonarCloud analyzes code quality, detects bugs, vulnerabilities, and code smells. It's the industry standard for continuous code quality inspection.

---

## 🚀 Step-by-Step Setup

### 1. Sign Up for SonarCloud

1. Go to https://sonarcloud.io
2. Click **"Log in"** → **"With GitHub"**
3. Authorize SonarCloud to access your GitHub account
4. Accept the terms of service

---

### 2. Import Your Repository

1. Click **"+"** (top right) → **"Analyze new project"**
2. Select **"Import an organization from GitHub"**
3. Choose your organization: **Tekashian**
4. Install SonarCloud GitHub App (if prompted)
5. Select repository: **The-Office-AiAgent**
6. Click **"Set Up"**

---

### 3. Configure Analysis Method

1. Choose: **"With GitHub Actions"** (recommended)
2. SonarCloud will show you the setup steps
3. Copy the displayed **SONAR_TOKEN**

Example token:
```
sqp_a1b2c3d4e5f6789012345678901234567890abcd
```

---

### 4. Add Token to GitHub Secrets

1. Go to: `https://github.com/Tekashian/The-Office-AiAgent/settings/secrets/actions`
2. Click **"New repository secret"**
3. Name: `SONAR_TOKEN`
4. Value: Paste your token from step 3
5. Click **"Add secret"**

---

### 5. Configure Project Key

The CI workflow uses this configuration:

```yaml
-Dsonar.projectKey=Tekashian_The-Office-AiAgent
-Dsonar.organization=tekashian
```

**Verify these match your SonarCloud setup:**

1. In SonarCloud, go to your project
2. Check **Project Information** (bottom left)
3. Confirm:
   - **Project Key**: `Tekashian_The-Office-AiAgent`
   - **Organization Key**: `tekashian` (lowercase!)

If different, update `.github/workflows/ci.yml`:
```yaml
-Dsonar.projectKey=YOUR_ACTUAL_PROJECT_KEY
-Dsonar.organization=YOUR_ACTUAL_ORG_KEY
```

---

### 6. Create SonarCloud Configuration File

Create `sonar-project.properties` in repository root:

```properties
sonar.projectKey=Tekashian_The-Office-AiAgent
sonar.organization=tekashian

# Project metadata
sonar.projectName=The Office Agent AI
sonar.projectVersion=1.0

# Source directories
sonar.sources=backend/src,frontend/app,frontend/components
sonar.tests=backend/src/__tests__

# Test coverage
sonar.javascript.lcov.reportPaths=backend/coverage/lcov.info
sonar.coverage.exclusions=**/*.test.ts,**/*.spec.ts,**/node_modules/**

# Code analysis parameters
sonar.sourceEncoding=UTF-8
sonar.language=ts,tsx

# Exclude third-party code
sonar.exclusions=**/node_modules/**,**/dist/**,**/*.d.ts,**/coverage/**,.next/**

# Security hotspot rules
sonar.security.hotspots.inherited=true
```

---

### 7. Configure Quality Gate (Optional)

1. In SonarCloud project, go to **Quality Gates**
2. Select **"Sonar way"** (default) or create custom
3. Recommended thresholds:
   - **Coverage**: ≥ 70%
   - **Duplicated Lines**: ≤ 3%
   - **Maintainability Rating**: A
   - **Reliability Rating**: A
   - **Security Rating**: A

---

## 📊 What SonarCloud Analyzes

### Code Quality
- **Bugs**: Logic errors, null pointer exceptions
- **Vulnerabilities**: Security issues (SQL injection, XSS)
- **Code Smells**: Maintainability issues
- **Duplications**: Copy-pasted code
- **Technical Debt**: Estimated time to fix issues

### Metrics
- **Complexity**: Cyclomatic complexity per function
- **Coverage**: Test coverage percentage
- **Lines of Code**: Project size
- **Maintainability**: A-E rating

---

## 🎯 Integration with GitHub

After setup, SonarCloud will:

1. **Check every PR** automatically
2. **Comment on PRs** with quality issues:
   ```
   SonarCloud Quality Gate: PASSED ✅
   
   0 Bugs
   2 Code Smells
   Coverage: 75.3% (+2.1%)
   0 Security Hotspots
   ```
3. **Block merges** if quality gate fails (optional)
4. **Track technical debt** over time

---

## 🔧 Troubleshooting

### "Organization not found"
```bash
# Check organization key is lowercase
-Dsonar.organization=tekashian  # ✅ Correct
-Dsonar.organization=Tekashian  # ❌ Wrong
```

### "Invalid token"
1. Regenerate token in SonarCloud:
   - My Account → Security → Generate Token
2. Update GitHub Secret
3. Re-run workflow

### "No coverage data"
```bash
# Ensure coverage is generated before SonarCloud scan:
- npm run test:coverage  # Must run BEFORE sonarcloud-github-action
- uses: SonarSource/sonarcloud-github-action@master
```

### "Project not found"
- Wait 5 minutes after creating project
- Verify projectKey matches exactly (case-sensitive)
- Check SonarCloud project exists and is active

---

## 📈 Viewing Results

### 1. SonarCloud Dashboard
https://sonarcloud.io/dashboard?id=Tekashian_The-Office-AiAgent

### 2. GitHub PR Comments
Automatic quality report on every PR

### 3. GitHub Checks
- ✅ **SonarCloud Code Analysis** check appears on commits
- Click **Details** to see full report

---

## 🎯 Best Practices

### 1. Fix Critical Issues First
```
Priority order:
1. Vulnerabilities (security)
2. Bugs (reliability)
3. Code Smells (maintainability)
```

### 2. Set Realistic Quality Gates
```
Start: 70% coverage, C rating
After 3 months: 75% coverage, B rating
After 6 months: 80% coverage, A rating
```

### 3. Review New Code Carefully
- Focus on **"New Code"** metrics (not legacy)
- Keep new code clean (stricter standards)
- Technical debt only on old code

### 4. Don't Ignore Security Hotspots
- Review all "Security Hotspots"
- Mark as "Safe" or "Fix"
- Document why something is safe

---

## ✅ Setup Complete!

Once configured, SonarCloud will:
- ✅ Analyze code on every push
- ✅ Comment on PRs with quality report
- ✅ Track quality trends over time
- ✅ Detect security vulnerabilities
- ✅ Measure technical debt

---

## 🔗 Useful Links

- **Dashboard**: https://sonarcloud.io/organizations/tekashian/projects
- **Documentation**: https://docs.sonarcloud.io/
- **Rules Explorer**: https://sonarcloud.io/organizations/tekashian/rules
- **Quality Profiles**: https://sonarcloud.io/organizations/tekashian/quality_profiles

**Next:** Commit changes and push to trigger CI pipeline
