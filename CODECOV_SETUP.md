# Codecov Setup Instructions

## 📊 What is Codecov?

Codecov tracks test coverage over time and integrates with GitHub to show coverage reports on pull requests.

---

## 🚀 Step-by-Step Setup

### 1. Sign Up for Codecov

1. Go to https://about.codecov.io/
2. Click **"Sign up"**
3. Select **"Sign up with GitHub"**
4. Authorize Codecov to access your GitHub account

---

### 2. Add Your Repository

1. After login, you'll see your dashboard
2. Click **"+ Add new repository"**
3. Search for: `The-Office-AiAgent`
4. Click **"Setup repo"**

---

### 3. Get Your Upload Token

1. On the repository page, navigate to **Settings**
2. Copy the **"Repository Upload Token"** (starts with `codecov-...` or is a UUID)
3. **This is your CODECOV_TOKEN** for GitHub Secrets!

Example:
```
12345678-1234-1234-1234-123456789abc
```

---

### 4. Add Token to GitHub Secrets

1. Go to: `https://github.com/Tekashian/The-Office-AiAgent/settings/secrets/actions`
2. Click **"New repository secret"**
3. Name: `CODECOV_TOKEN`
4. Value: Paste your token from step 3
5. Click **"Add secret"**

---

### 5. Configure Codecov (Optional)

Create a file: `codecov.yml` in your repository root:

```yaml
coverage:
  status:
    project:
      default:
        target: 70%
        threshold: 5%
    patch:
      default:
        target: 80%

comment:
  layout: "header, diff, files, footer"
  behavior: default
  require_changes: false

ignore:
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/node_modules/**"
```

---

### 6. Verify Integration

After your next push:

1. Check GitHub Actions run completes
2. Go to Codecov dashboard
3. You should see coverage data appear
4. Check your PR - there should be a Codecov comment with coverage diff

---

## 📈 What You'll See

### On Pull Requests:
```
Codecov Report
Coverage: 75.32% (+2.15%) 🎉
Files changed: 3
  
src/utils/encryption.ts   90.32% (+5.12%)
src/services/aiService.ts 57.30% (-2.45%)
```

### On Dashboard:
- Coverage trends over time
- File-by-file coverage
- Coverage sunburst visualization
- Historical data

---

## 🎯 Best Practices

1. **Set realistic targets**: Start with 70%, increase gradually
2. **Review coverage on PRs**: Don't merge if coverage drops significantly
3. **Focus on critical paths**: 100% coverage on auth, encryption, payment logic
4. **Don't chase 100%**: Diminishing returns after 80-85%

---

## 🔧 Troubleshooting

### "No coverage reports found"
```bash
# Check coverage file is generated:
ls backend/coverage/coverage-final.json

# Check workflow uploads coverage:
uses: codecov/codecov-action@v4
with:
  files: ./backend/coverage/coverage-final.json
```

### "Token invalid"
- Regenerate token in Codecov settings
- Update GitHub Secret
- Re-run workflow

---

## ✅ Setup Complete!

Once configured, Codecov will:
- ✅ Track coverage on every push
- ✅ Comment on PRs with coverage changes
- ✅ Block PRs if coverage drops below threshold
- ✅ Show coverage trends over time

**Next:** Proceed to SonarCloud setup
