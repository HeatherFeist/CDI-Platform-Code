# Constructive Designs Inc. Monorepo

A unified workspace for all Constructive Designs Inc. nonprofit apps and services.

## 🏗️ Apps

### 1. **RenovVision** (`packages/renovision`)
- AI-powered estimates, project management, and job costing
- Deployed at: https://renovision.web.app

### 2. **Materials Marketplace** (`packages/marketplace`)
- Buy and sell new/used materials, auctions, local pickup
- Deployed at: https://marketplace-cd.web.app

### 3. **Quantum Wallet** (`packages/quantum-wallet`)
- Manage USD, crypto, merchant coins, and time tracking
- Deployed at: https://wallet-cd.web.app

### 4. **Gemini Image Editor** (`packages/image-editor`)
- AI-powered image generation and editing
- Used across all apps

---

## 🚀 Quick Start

### Install dependencies for all apps:
```bash
npm install
```

### Run all apps in development mode:
```bash
npm run dev
```

### Run a specific app:
```bash
npm run renovision:dev
npm run marketplace:dev
npm run wallet:dev
npm run image-editor:dev
```

### Build all apps:
```bash
npm run build
```

### Build a specific app:
```bash
npm run renovision:build
npm run marketplace:build
npm run wallet:build
npm run image-editor:build
```

### Deploy a specific app:
```bash
npm run renovision:deploy
npm run marketplace:deploy
npm run wallet:deploy
npm run image-editor:deploy
```

---

## 📁 Project Structure

```
constructive-designs-monorepo/
├── packages/
│   ├── renovision/          # RenovVision app
│   ├── marketplace/         # Materials Marketplace app
│   ├── quantum-wallet/      # Quantum Wallet app
│   └── image-editor/        # Gemini Image Editor app
├── shared/                  # Shared utilities, types, components (optional)
├── package.json             # Root workspace config
└── README.md
```

---

## 🔧 Environment Variables

Each app has its own `.env` or `.env.local` file. See each app's README for specific configuration:
- `packages/renovision/.env.local`
- `packages/marketplace/.env.local`
- `packages/quantum-wallet/.env.local`
- `packages/image-editor/.env.local`

---

## 🛠️ Development

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Firebase CLI**: For deployment
- **Supabase**: For backend/database

---

## 📦 Workspaces

This monorepo uses npm workspaces to manage dependencies across all apps. Shared dependencies are hoisted to the root `node_modules`, while app-specific dependencies remain in each package.

---

## 🤝 Contributing

This is a nonprofit project. Contributions are welcome! Please see individual app READMEs for contribution guidelines.

---

## 📄 License

Apache-2.0 - Constructive Designs Inc.
