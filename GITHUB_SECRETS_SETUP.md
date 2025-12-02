# GitHub Secrets Setup Instructions

## 🔐 Required Secrets for CI/CD

Follow these steps to add secrets to your GitHub repository.

---

## 📍 Where to Add Secrets

1. Navigate to: `https://github.com/Tekashian/The-Office-AiAgent/settings/secrets/actions`
2. Or: Repository → **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** for each secret below

---

## 🚀 Step 1: Docker & Container Registry

### DOCKER_USERNAME
```
Your Docker Hub username
Example: tekashian
```
**How to get:**
1. Go to https://hub.docker.com
2. Sign up or log in
3. Your username is in the top right corner

---

### DOCKER_PASSWORD
```
Docker Hub Access Token (NOT your password!)
```
**How to generate:**
1. Go to https://hub.docker.com/settings/security
2. Click **"New Access Token"**
3. Name: `GitHub-Actions-CI-CD`
4. Permissions: **Read, Write, Delete**
5. Click **"Generate"**
6. ⚠️ **Copy the token NOW** (it won't be shown again)

---

## ☁️ Step 2: Cloud Provider (AWS) - OPTIONAL FOR NOW

Skip these if deploying locally or using different cloud:

### AWS_ACCESS_KEY_ID
```
Your AWS IAM Access Key ID
```

### AWS_SECRET_ACCESS_KEY
```
Your AWS IAM Secret Access Key
```

### AWS_REGION
```
us-east-1
(or your preferred region)
```

**How to get:**
1. AWS Console → IAM → Users → Your User
2. Security credentials → Create access key
3. Select: "Command Line Interface (CLI)"
4. Save the Access Key ID and Secret Access Key

---

## 🗄️ Step 3: Supabase Secrets

### SUPABASE_URL
```
https://cunuvyqkijgipctivghq.supabase.co
```
✅ Already have this from your `.env` file!

---

### SUPABASE_SERVICE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bnV2eXFraWpnaXBjdGl2Z2hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxMTU3OSwiZXhwIjoyMDc4Nzg3NTc5fQ.rxz8vJ_IgLdJxTXNEAsEPFfQydOO8y3cxa1NzEQ8Gg8
```
✅ Already have this from your `.env` file!

---

### SUPABASE_PROJECT_ID
```
cunuvyqkijgipctivghq
```
**How to get:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → General → Project ID

---

## 🔑 Step 4: Application Secrets

### TEST_ENCRYPTION_KEY
```
Generate a new 64-character hex key for testing
```
**How to generate:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
⚠️ **Use a DIFFERENT key than production** (from your `.env` file)

Example output:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

---

### AI_API_KEY
```
AIzaSyD_QxqYAO4_jwipRPC07QcOi5AlapPnZr8
```
✅ Already have this from your `.env` file!

---

## 📢 Step 5: Integrations

### SLACK_WEBHOOK_URL - OPTIONAL
```
https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```
**How to get:**
1. Go to https://api.slack.com/apps
2. Click **"Create New App"** → From scratch
3. Name: `Office Agent CI/CD`
4. Select workspace
5. **Incoming Webhooks** → Activate
6. **Add New Webhook to Workspace**
7. Select channel (e.g., `#deployments`)
8. Copy the Webhook URL

---

### CODECOV_TOKEN - OPTIONAL (Coverage Reports)
```
Will be generated after Codecov setup
```
**Setup instructions in next section**

---

### SONAR_TOKEN - OPTIONAL (Code Quality)
```
Will be generated after SonarCloud setup
```
**Setup instructions in next section**

---

### OPENAI_API_KEY - OPTIONAL (AI Code Review)
```
sk-...
```
**How to get:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy and save immediately

---

## ✅ Quick Setup Checklist

### Minimum Required (for basic CI/CD):
- [ ] DOCKER_USERNAME
- [ ] DOCKER_PASSWORD
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_KEY
- [ ] TEST_ENCRYPTION_KEY
- [ ] AI_API_KEY

### Optional (enhanced features):
- [ ] SLACK_WEBHOOK_URL (deployment notifications)
- [ ] CODECOV_TOKEN (coverage tracking)
- [ ] SONAR_TOKEN (code quality)
- [ ] OPENAI_API_KEY (AI code review)
- [ ] AWS credentials (if deploying to AWS)

---

## 🎯 What Happens After Adding Secrets?

1. **Commit and push** your CI/CD files to GitHub
2. CI pipeline will **automatically run** on push
3. Tests will run in isolated environment
4. Coverage reports generated
5. Security scans performed
6. Build artifacts created

---

## 🔒 Security Best Practices

✅ **DO:**
- Use different keys for staging/production
- Rotate secrets every 90 days
- Use tokens instead of passwords
- Limit token permissions (read/write only what's needed)

❌ **DON'T:**
- Commit secrets to git (use `.env` files with `.gitignore`)
- Share secrets in chat/email
- Use production keys for testing
- Reuse the same key across environments

---

## 🚨 If Secrets Are Compromised

1. **Immediately rotate** the compromised secret
2. Update GitHub Secret with new value
3. Re-deploy affected services
4. Check audit logs for unauthorized access

---

**Next:** Proceed to Codecov and SonarCloud setup (see main CI_CD_GUIDE.md)
