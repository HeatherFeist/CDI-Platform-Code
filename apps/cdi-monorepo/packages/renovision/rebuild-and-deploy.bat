@echo off
echo ========================================
echo REBUILDING AND DEPLOYING WITH FIX
echo ========================================
echo.

echo Step 1: Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo Step 2: Deploying to Firebase...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo ERROR: Deploy failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo SUCCESS! Your app is deployed!
echo ========================================
echo.
echo Open: https://renovision.web.app
echo Press Ctrl+Shift+R to hard refresh
echo.
pause
