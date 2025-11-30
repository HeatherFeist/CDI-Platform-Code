# Midnight Theme Update

## Overview
The Smart Hub UI has been updated to match the "Smart Home Midnight" aesthetic based on the provided reference image.

## Key Changes

### Color Palette
- **Background**: Deep Midnight (`#141824`) - Replaces the previous generic navy.
- **Cards**: Dark Blue-Grey (`#1F2536`) - Provides subtle contrast for content areas.
- **Primary Accent**: Vibrant Electric Blue (`#2D68FF`) - High-contrast action color.
- **Gradient**: Vibrant Blue to Cyan (`linear-gradient(135deg, #2D68FF 0%, #00C2FF 100%)`).

### Visual Style
- **Glassmorphism**: Extensive use of `backdrop-blur-xl` and semi-transparent backgrounds (`bg-gray-900/90`, `bg-gray-800/50`).
- **Glow Effects**: Added ambient background glows (`bg-primary-500/20`, `bg-purple-500/10`) to create depth.
- **Typography**: Updated headings to use white and transparent gradients for a modern look.
- **Borders**: Subtle borders (`border-gray-700`) to define structure without being overwhelming.

### Components Updated
- **Navigation Bar**: Now uses a high-blur glass effect with the new midnight background.
- **Hero Section**: Completely redesigned with glow effects, new typography, and vibrant call-to-action buttons.
- **Apps Grid**: Cards now use the dark theme with hover glow effects.
- **Turnkey & Features**: Aligned with the new dark aesthetic.

## Files Modified
- `apps/smart-hub/src/styles/modern-theme.css`
- `apps/smart-hub/src/components/LandingPage.tsx`
- `apps/smart-hub/index.html`
