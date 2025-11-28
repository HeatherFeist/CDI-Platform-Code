# Home Reno Vision Pro Deployment Script

Write-Host "🚀 Starting deployment for Home Reno Vision Pro..." -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseInstalled) {
    Write-Host "❌ Firebase CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Step 1: Clean previous build
Write-Host "🧹 Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Cleaned dist folder" -ForegroundColor Green
}

# Step 2: Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Step 3: Run build
Write-Host ""
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors and try again." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful!" -ForegroundColor Green

# Step 4: Check if dist folder exists
if (-not (Test-Path "dist")) {
    Write-Host "❌ dist folder not found after build!" -ForegroundColor Red
    exit 1
}

# Step 5: Show build size
$distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "📊 Build size: $([math]::Round($distSize, 2)) MB" -ForegroundColor Cyan

# Step 6: Deploy to Firebase
Write-Host ""
Write-Host "🌐 Deploying to Firebase..." -ForegroundColor Yellow
Write-Host "Target: https://renovision.constructivedesignsinc.org" -ForegroundColor Cyan
Write-Host ""

firebase deploy --only hosting:renovision

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Your app is live at:" -ForegroundColor Green
    Write-Host "   https://renovision.constructivedesignsinc.org" -ForegroundColor Cyan
    Write-Host "   https://renovision.web.app" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔍 Don't forget to:" -ForegroundColor Yellow
    Write-Host "   1. Test all pages" -ForegroundColor White
    Write-Host "   2. Verify authentication works" -ForegroundColor White
    Write-Host "   3. Check database connections" -ForegroundColor White
    Write-Host "   4. Verify OAuth redirects" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
    exit 1
}
