# Gemini API Diagnostic Script
# Run this in PowerShell to test your API key

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

Write-Host "🔍 Gemini API Diagnostics" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Key Format
Write-Host "1. Testing API Key Format..." -ForegroundColor Yellow
if ($ApiKey.Length -lt 20) {
    Write-Host "❌ API key too short ($($ApiKey.Length) characters)" -ForegroundColor Red
    exit 1
}

if (-not $ApiKey.StartsWith("AIza")) {
    Write-Host "❌ API key should start with 'AIza' but starts with '$($ApiKey.Substring(0,4))'" -ForegroundColor Red
    exit 1
}

if ($ApiKey.Contains(" ")) {
    Write-Host "❌ API key contains spaces" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Key format looks correct ($($ApiKey.Length) characters)" -ForegroundColor Green
Write-Host ""

# Test 2: Check Available Models
Write-Host "2. Checking Available Models..." -ForegroundColor Yellow
$modelsUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=$ApiKey"

try {
    $response = Invoke-RestMethod -Uri $modelsUrl -Method Get
    if ($response.models) {
        Write-Host "✅ Found $($response.models.Count) available models:" -ForegroundColor Green
        foreach ($model in $response.models) {
            Write-Host "   - $($model.name)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ No models found in response" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking models: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*403*" -or $_.Exception.Message -like "*Forbidden*") {
        Write-Host "🔒 Permission denied - possible causes:" -ForegroundColor Yellow
        Write-Host "   • API key created in wrong place (use Google AI Studio)" -ForegroundColor Yellow
        Write-Host "   • Geographic restriction (try VPN)" -ForegroundColor Yellow
        Write-Host "   • Billing not enabled (enable in Google Cloud Console)" -ForegroundColor Yellow
    }
    
    if ($_.Exception.Message -like "*404*" -or $_.Exception.Message -like "*Not Found*") {
        Write-Host "🚫 Service not found - possible causes:" -ForegroundColor Yellow
        Write-Host "   • Gemini not available in your region" -ForegroundColor Yellow
        Write-Host "   • API key doesn't have Gemini access" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 3: Test Specific Models
Write-Host "3. Testing Specific Models..." -ForegroundColor Yellow
$modelsToTest = @(
    "gemini-pro",
    "gemini-1.5-pro", 
    "gemini-1.5-flash",
    "models/gemini-pro",
    "models/gemini-1.5-pro"
)

foreach ($modelName in $modelsToTest) {
    Write-Host "Testing $modelName..." -ForegroundColor Gray
    
    $requestBody = @{
        contents = @(
            @{
                parts = @(
                    @{
                        text = "Say 'test successful' if you can read this."
                    }
                )
            }
        )
    } | ConvertTo-Json -Depth 3
    
    $testUrl = "https://generativelanguage.googleapis.com/v1beta/models/$($modelName):generateContent?key=$ApiKey"
    
    try {
        $response = Invoke-RestMethod -Uri $testUrl -Method Post -Body $requestBody -ContentType "application/json"
        if ($response.candidates -and $response.candidates[0].content.parts[0].text) {
            $responseText = $response.candidates[0].content.parts[0].text
            Write-Host "✅ $modelName: SUCCESS - '$responseText'" -ForegroundColor Green
        } else {
            Write-Host "❌ $modelName: No valid response" -ForegroundColor Red
        }
    } catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -like "*404*") {
            Write-Host "❌ $modelName: Model not found/available" -ForegroundColor Red
        } elseif ($errorMsg -like "*403*") {
            Write-Host "❌ $modelName: Permission denied" -ForegroundColor Red
        } else {
            Write-Host "❌ $modelName: $errorMsg" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "🌍 Geographic Check..." -ForegroundColor Yellow
Write-Host "If ALL models failed, you might be in a region where Gemini is not available." -ForegroundColor Yellow
Write-Host "Supported regions include: US, Canada, UK, EU, Australia, Japan, South Korea" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Solutions to try:" -ForegroundColor Cyan
Write-Host "1. Use VPN to connect from a supported region" -ForegroundColor White
Write-Host "2. Enable billing in Google Cloud Console (console.cloud.google.com)" -ForegroundColor White
Write-Host "3. Create API key in Google AI Studio (aistudio.google.com/apikey)" -ForegroundColor White
Write-Host "4. Wait 24 hours after creating the API key" -ForegroundColor White