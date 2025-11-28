# Monorepo Setup Instructions

## Step 1: Move Apps into Monorepo

You need to move your existing apps into the `packages/` directory:

### Using PowerShell:

```powershell
# Navigate to Downloads folder
cd C:\Users\heath\Downloads

# Move RenovVision
Move-Item "home-reno-vision-pro (2)" "constructive-designs-monorepo\packages\renovision"

# Move Marketplace
Move-Item "constructive-designs-marketplace" "constructive-designs-monorepo\packages\marketplace"

# Move Quantum Wallet (if it's a separate folder)
# If quantum-wallet is inside home-reno-vision-pro, you'll need to extract it first
Move-Item "home-reno-vision-pro (2)\quantum-wallet" "constructive-designs-monorepo\packages\quantum-wallet"

# Move Gemini Image Editor
Move-Item "CDI Gemini Image Editor" "constructive-designs-monorepo\packages\image-editor"
```

## Step 2: Install Dependencies

```powershell
cd constructive-designs-monorepo
npm install
```

This will install all dependencies for all apps.

## Step 3: Update Each App's package.json

Make sure each app has the following in its package.json:

```json
{
  "name": "@constructive-designs/app-name",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "deploy": "firebase deploy"
  }
}
```

## Step 4: Test

Run a specific app:
```powershell
npm run renovision:dev
```

Or run all apps:
```powershell
npm run dev
```

---

## Alternative: Create Symlinks (if you want to keep original folders)

If you don't want to move the folders, you can create symbolic links:

```powershell
# Create symlinks instead of moving
New-Item -ItemType SymbolicLink -Path "constructive-designs-monorepo\packages\renovision" -Target "C:\Users\heath\Downloads\home-reno-vision-pro (2)"
New-Item -ItemType SymbolicLink -Path "constructive-designs-monorepo\packages\marketplace" -Target "C:\Users\heath\Downloads\constructive-designs-marketplace"
New-Item -ItemType SymbolicLink -Path "constructive-designs-monorepo\packages\image-editor" -Target "C:\Users\heath\Downloads\CDI Gemini Image Editor"
```

---

## Next Steps

After setup, you can:
- Run all apps from one place
- Share code between apps
- Deploy all apps with one command
- Manage dependencies centrally
