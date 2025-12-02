#!/usr/bin/env pwsh
# CI/CD Verification Script
# Run after adding GitHub Secrets

Write-Host "`n🔍 CI/CD Configuration Verification`n" -ForegroundColor Cyan

$errors = @()
$warnings = @()

# Check 1: Git repository
Write-Host "✓ Checking Git repository..." -ForegroundColor Gray
if (-not (Test-Path ".git")) {
    $errors += "Not a git repository"
} else {
    $remote = git remote get-url origin 2>$null
    if ($remote -match "Tekashian/The-Office-AiAgent") {
        Write-Host "  ✓ Correct repository" -ForegroundColor Green
    } else {
        $warnings += "Remote origin does not match expected repository"
    }
}

# Check 2: Required workflow files
Write-Host "`n✓ Checking GitHub Actions workflows..." -ForegroundColor Gray
$workflows = @("ci.yml", "cd.yml", "pr-checks.yml")
foreach ($workflow in $workflows) {
    $path = ".github/workflows/$workflow"
    if (Test-Path $path) {
        Write-Host "  ✓ $workflow exists" -ForegroundColor Green
    } else {
        $errors += "Missing workflow: $workflow"
    }
}

# Check 3: Docker files
Write-Host "`n✓ Checking Docker configuration..." -ForegroundColor Gray
$dockerFiles = @(
    "backend/Dockerfile",
    "frontend/Dockerfile",
    "docker-compose.yml"
)
foreach ($file in $dockerFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file exists" -ForegroundColor Green
    } else {
        $errors += "Missing Docker file: $file"
    }
}

# Check 4: Test infrastructure
Write-Host "`n✓ Checking test infrastructure..." -ForegroundColor Gray
if (Test-Path "backend/jest.config.js") {
    Write-Host "  ✓ Jest configured" -ForegroundColor Green
    
    # Check test files
    $testFiles = Get-ChildItem "backend/src/__tests__" -Recurse -Filter "*.test.ts" -ErrorAction SilentlyContinue
    if ($testFiles.Count -gt 0) {
        Write-Host "  ✓ $($testFiles.Count) test files found" -ForegroundColor Green
    } else {
        $warnings += "No test files found"
    }
} else {
    $errors += "Jest configuration missing"
}

# Check 5: Environment files
Write-Host "`n✓ Checking environment configuration..." -ForegroundColor Gray
if (Test-Path "backend/.env") {
    Write-Host "  ✓ backend/.env exists" -ForegroundColor Green
} else {
    $warnings += "backend/.env not found (required for local development)"
}

if (Test-Path "backend/.env.example") {
    Write-Host "  ✓ backend/.env.example exists" -ForegroundColor Green
} else {
    $warnings += "backend/.env.example missing"
}

# Check 6: Pre-commit hook
Write-Host "`n✓ Checking security hooks..." -ForegroundColor Gray
if (Test-Path ".git/hooks/pre-commit") {
    Write-Host "  ✓ Pre-commit hook installed" -ForegroundColor Green
} else {
    $warnings += "Pre-commit hook not found"
}

# Check 7: Dependencies
Write-Host "`n✓ Checking dependencies..." -ForegroundColor Gray
if (Test-Path "backend/node_modules") {
    Write-Host "  ✓ Backend dependencies installed" -ForegroundColor Green
} else {
    $warnings += "Run: cd backend; npm install"
}

if (Test-Path "frontend/node_modules") {
    Write-Host "  ✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    $warnings += "Run: cd frontend; npm install"
}

# Check 8: Documentation
Write-Host "`n✓ Checking documentation..." -ForegroundColor Gray
$docs = @("CI_CD_GUIDE.md", "TESTING_GUIDE.md", "SETUP_PROGRESS.md")
foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "  ✓ $doc exists" -ForegroundColor Green
    }
}

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

if ($errors.Count -eq 0) {
    Write-Host "`n✅ All critical checks passed!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Errors found ($($errors.Count)):" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  • $error" -ForegroundColor Red
    }
}

if ($warnings.Count -gt 0) {
    Write-Host "`n⚠️  Warnings ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  • $warning" -ForegroundColor Yellow
    }
}

# GitHub Secrets reminder
Write-Host "`n📋 GitHub Secrets Status:" -ForegroundColor Cyan
Write-Host "  Cannot verify from local machine (requires GitHub API)" -ForegroundColor Gray
Write-Host "  Please verify manually at:" -ForegroundColor Gray
Write-Host "  https://github.com/Tekashian/The-Office-AiAgent/settings/secrets/actions" -ForegroundColor Yellow

Write-Host "`n  Required secrets:" -ForegroundColor Gray
Write-Host "  • SUPABASE_URL" -ForegroundColor White
Write-Host "  • SUPABASE_ANON_KEY" -ForegroundColor White
Write-Host "  • SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
Write-Host "  • SUPABASE_PROJECT_ID" -ForegroundColor White
Write-Host "  • AI_API_KEY" -ForegroundColor White
Write-Host "  • TEST_ENCRYPTION_KEY" -ForegroundColor White

# Next steps
Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
if ($errors.Count -eq 0) {
    Write-Host "  1. Add GitHub Secrets (if not done)" -ForegroundColor White
    Write-Host "  2. Push changes to trigger CI: git push origin master" -ForegroundColor White
    Write-Host "  3. Monitor at: https://github.com/Tekashian/The-Office-AiAgent/actions" -ForegroundColor White
    Write-Host "  4. Create test PR to verify automation" -ForegroundColor White
    Write-Host "  5. Tag v1.0.0 for production deployment" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "  1. Fix errors listed above" -ForegroundColor White
    Write-Host "  2. Re-run this script" -ForegroundColor White
    Write-Host ""
}

exit $errors.Count
