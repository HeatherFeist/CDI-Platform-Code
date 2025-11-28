# AI Product Suggestions - Quick Setup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AI Product Suggestions - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will set up the AI Product Suggestion system." -ForegroundColor Yellow
Write-Host ""
Write-Host "What it does:" -ForegroundColor White
Write-Host "  • Creates database tables for product suggestions" -ForegroundColor Gray
Write-Host "  • Sets up caching system (7-day expiry)" -ForegroundColor Gray
Write-Host "  • Integrates with your estimate creator" -ForegroundColor Gray
Write-Host ""

# Check if SQL file exists
$sqlFile = "SQL Files\add-ai-product-suggestions.sql"
if (Test-Path $sqlFile) {
    Write-Host "✓ SQL migration file found" -ForegroundColor Green
} else {
    Write-Host "✗ SQL migration file not found!" -ForegroundColor Red
    Write-Host "  Expected location: $sqlFile" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 1: Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You need to run the SQL migration in Supabase:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open Supabase Dashboard" -ForegroundColor White
Write-Host "2. Go to SQL Editor" -ForegroundColor White
Write-Host "3. Copy contents of: $sqlFile" -ForegroundColor White
Write-Host "4. Paste and click 'Run'" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Have you completed the database setup? (y/n)"
if ($continue -ne "y") {
    Write-Host ""
    Write-Host "Please complete the database setup first, then run this script again." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 2: Verify Gemini API Key" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The AI Product Suggestions use your Gemini API key." -ForegroundColor Yellow
Write-Host ""
Write-Host "Checking if Gemini API key is configured..." -ForegroundColor Gray

# We can't check the database from PowerShell, so just inform the user
Write-Host ""
Write-Host "To verify your API key:" -ForegroundColor White
Write-Host "1. Go to Supabase Dashboard → SQL Editor" -ForegroundColor Gray
Write-Host "2. Run: SELECT gemini_api_key FROM api_keys LIMIT 1;" -ForegroundColor Gray
Write-Host "3. If NULL, add your key in App Settings" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 3: Integration Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if AIProductSuggestions component exists
if (Test-Path "components\AIProductSuggestions.tsx") {
    Write-Host "✓ AIProductSuggestions component exists" -ForegroundColor Green
} else {
    Write-Host "✗ AIProductSuggestions component not found!" -ForegroundColor Red
    exit 1
}

# Check if service exists
if (Test-Path "services\aiProductSuggestionService.ts") {
    Write-Host "✓ AIProductSuggestionService exists" -ForegroundColor Green
} else {
    Write-Host "✗ AIProductSuggestionService not found!" -ForegroundColor Red
    exit 1
}

# Check if integrated in EstimatesView
$estimatesView = Get-Content "components\EstimatesView.tsx" -Raw
if ($estimatesView -match "AIProductSuggestions") {
    Write-Host "✓ Integrated into EstimatesView" -ForegroundColor Green
} else {
    Write-Host "✗ Not yet integrated into EstimatesView" -ForegroundColor Red
    Write-Host "  You need to add the component to your estimate creator" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 4: Test the Integration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To test:" -ForegroundColor Yellow
Write-Host "1. Go to Estimates page" -ForegroundColor White
Write-Host "2. Create or edit an estimate" -ForegroundColor White
Write-Host "3. Add a line item (e.g., 'Interior paint for bedroom')" -ForegroundColor White
Write-Host "4. Look for 'Get Product Suggestions' button" -ForegroundColor White
Write-Host "5. Click it and wait ~5 seconds" -ForegroundColor White
Write-Host "6. You should see top 3 contractor-grade products!" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "• Restart your dev server if it's running" -ForegroundColor Gray
Write-Host "• Test with a sample line item" -ForegroundColor Gray
Write-Host "• Check browser console (F12) for any errors" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation:" -ForegroundColor White
Write-Host "• Full guide: AI_PRODUCT_SUGGESTIONS_COMPLETE.md" -ForegroundColor Gray
Write-Host ""
Write-Host "Need help? Check the troubleshooting section in the docs!" -ForegroundColor Cyan
Write-Host ""
