# FieldTrack — Workforce Attendance Platform

> A lightweight, cross-platform **Electron** desktop application for workforce attendance tracking. Employees can clock in/out, capture screenshots, and report their location 
---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Run in Development Mode](#4-run-in-development-mode)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Building Executables](#building-executables)
  - [Windows (NSIS Installer)](#windows-nsis-installer)
  - [macOS (DMG)](#macos-dmg)
  - [Linux (AppImage / deb)](#linux-appimage--deb)
  - [Build Output](#build-output)
- [Build Configuration](#build-configuration)
- [Icons & Assets](#icons--assets)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)

---

## Features

- 🖥️ **Custom frameless window** with splash screen on startup
- 🔐 **Persistent login session** — stays in system tray when closed
- 🕐 **Clock In / Clock Out** with automatic clock-out on system shutdown
- 📸 **Silent screenshot capture** on clock-in (via `desktopCapturer`)
- 📍 **Geolocation** using native Windows Location API with IP-based fallback
- 🌙 **System theme detection** (dark / light) and live theme switching
- 🔁 **Single instance lock** — reopens existing window on second launch
- 🚀 **Auto-launch at login** (`openAtLogin: true`)
- 📦 **ASAR-compressed build** with maximum compression for minimal executable size

---

## Architecture Overview

```
index.js                ← Electron main process entry point
preload.js              ← Context bridge (exposes safe APIs to renderer)
login.html              ← Login page (renderer)
clockin.html            ← Clock-in dashboard (renderer)
splash.html             ← Startup splash screen
styles.css              ← Shared stylesheet
src/
  main/
    window.js           ← BrowserWindow creation & session permissions
    ipc/
      screenshot.js     ← IPC: capture-screenshot handler
      location.js       ← IPC: get-geolocation handler
    utils/
      http.js           ← Node-native HTTP/HTTPS fetch utility
assets/
  icons/                ← App icons (.ico, .icns, .png)
  images/               ← UI imagery
```

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| [Node.js](https://nodejs.org/) | ≥ 18.x | LTS recommended |
| npm | ≥ 9.x | Bundled with Node.js |
| [Git](https://git-scm.com/) | Any | For cloning |
| **Windows only** — [Visual Studio Build Tools](https://aka.ms/vs/17/release/vs_BuildTools.exe) | 2019+ | Needed by some native modules |
| **macOS only** — Xcode Command Line Tools | Any | `xcode-select --install` |

> **Note:** `electron-builder` must be installed separately (see below) as it is a dev dependency used only during the build step.

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd emp-track
```

### 2. Install Dependencies

```bash
npm install
```

To also install `electron-builder` (required for packaging):

```bash
npm install --save-dev electron-builder
```

### 3. Configure Environment Variables

Copy the example env file and fill in your values:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Then open `.env` and edit as needed (see [Environment Variables](#environment-variables) for details).

> ⚠️ **Never commit `.env` to version control.** It is already listed in `.gitignore`.

### 4. Run in Development Mode

```bash
# Standard run
npm start

# With DevTools inspector enabled (port 5858)
npm run dev
```

The app will launch with the splash screen, then show the login page.

---

## Project Structure

```
emp-track/
├── .env                    # Local environment config (git-ignored)
├── .env.example            # Template — copy this to create .env
├── .gitignore
├── index.js                # Main Electron process
├── preload.js              # Secure context bridge
├── login.html              # Login UI
├── clockin.html            # Attendance dashboard UI
├── splash.html             # Startup splash screen
├── styles.css              # Shared CSS
├── package.json
├── assets/
│   ├── icons/
│   │   ├── app-icon.ico    # Windows icon
│   │   ├── app-icon.icns   # macOS icon
│   │   └── app-icon.png    # Linux / fallback icon
│   ├── tray-icon.png       # System tray icon (16×16 or 32×32 PNG)
│   └── images/
└── src/
    └── main/
        ├── window.js
        ├── ipc/
        │   ├── screenshot.js
        │   └── location.js
        └── utils/
            └── http.js
```

---

## Environment Variables

Create a `.env` file in the project root. All variables are loaded at startup via `dotenv`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_BASE_URL` | ✅ | `http://localhost:3000` | Base URL of your backend REST API |
| `API_PATH` | ✅ | `/api/v1` | API path prefix |
| `WEB_APP_URL` | ✅ | `http://localhost:3001` | URL of the web frontend (for trusted origins) |
| `NODE_ENV` | ❌ | `development` | Set to `production` for release builds |

### Example `.env`

```env
API_BASE_URL=https://your-api.example.com
API_PATH=/api/v1
WEB_APP_URL=https://your-webapp.example.com
NODE_ENV=production
```

### `.env.example` (commit this file)

```env
# FieldTrack — Environment Configuration
# Copy this file to .env and fill in your values.

API_BASE_URL=https://your-api.example.com
API_PATH=/api/v1
WEB_APP_URL=https://your-webapp.example.com
NODE_ENV=production
```

---

## Building Executables

`electron-builder` is used to package the app. All build configuration lives in `package.json` under the `"build"` key.

### Windows (NSIS Installer)

Run on a **Windows** machine:

```bash
npm run build
```

This produces a one-click NSIS installer (`.exe`) targeting **x64**:

```
dist/
└── FieldTrack Setup 1.0.0.exe
```

**Installer behaviour:**
- One-click silent install (no wizard screens)
- Creates a Desktop shortcut automatically
- Launches the app after installation completes
- Cleans up AppData on uninstall

### macOS (DMG)

First, add the macOS target to `package.json`:

```json
"mac": {
  "icon": "assets/icons/app-icon.icns",
  "target": [{ "target": "dmg", "arch": ["x64", "arm64"] }],
  "category": "public.app-category.business"
},
"dmg": {
  "title": "FieldTrack",
  "icon": "assets/icons/app-icon.icns"
}
```

Then build on a **macOS** machine:

```bash
npm run build
```

Output:

```
dist/
└── FieldTrack-1.0.0.dmg
```

> 📝 To notarize for distribution outside the Mac App Store, set `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` environment variables and configure the `notarize` hook in `electron-builder`.

### Linux (AppImage / deb)

Add the Linux target to `package.json`:

```json
"linux": {
  "icon": "assets/icons/app-icon.png",
  "target": [
    { "target": "AppImage", "arch": ["x64"] },
    { "target": "deb",      "arch": ["x64"] }
  ],
  "category": "Office"
}
```

Then build on a **Linux** machine (or in CI):

```bash
npm run build
```

Output:

```
dist/
├── FieldTrack-1.0.0.AppImage
└── fieldtrack_1.0.0_amd64.deb
```

### Build Output

All build artefacts land in the `dist/` directory (git-ignored). The folder structure looks like:

```
dist/
├── win-unpacked/           # Unpacked Windows build (debugging)
├── FieldTrack Setup 1.0.0.exe
├── FieldTrack-1.0.0.dmg    # macOS
└── FieldTrack-1.0.0.AppImage  # Linux
```

---

## Build Configuration

Relevant settings in `package.json → "build"`:

| Setting | Value | Effect |
|---------|-------|--------|
| `asar` | `true` | Packs app source into a single `.asar` archive |
| `compression` | `"maximum"` | Maximum zlib compression — smaller file, slower build |
| `files` | see below | Only bundles production-needed files |
| `nsis.oneClick` | `true` | Silent one-click installer on Windows |
| `nsis.createDesktopShortcut` | `true` | Adds a Desktop shortcut after install |
| `nsis.runAfterFinish` | `true` | Auto-launches the app post-install |
| `nsis.deleteAppDataOnUninstall` | `true` | Cleans AppData on uninstall |

**Bundled files** (only these are packed into the installer):

```
index.js
preload.js
src/**/*
assets/**/*
*.html
*.css
```

**Excluded from the bundle:**

```
**/*.map     ← Source maps
**/temp/*    ← Temp files
node_modules ← Not excluded by default; electron-builder handles pruning
```

---

## Icons & Assets

Place your icon files in `assets/icons/`:

| File | Platform | Recommended Size |
|------|----------|-----------------|
| `app-icon.ico` | Windows | 256×256 (multi-size ICO) |
| `app-icon.icns` | macOS | 512×512 (ICNS bundle) |
| `app-icon.png` | Linux / fallback | 512×512 PNG |
| `tray-icon.png` | All (system tray) | 16×16 or 32×32 PNG |

You can generate `.ico` and `.icns` files from a single high-resolution PNG using:

```bash
# Using electron-icon-builder (optional dev dependency)
npx electron-icon-builder --input=assets/icons/app-icon.png --output=assets/icons/
```

---

## Security Notes

- **Context Isolation** is enabled (`contextIsolation: true`) — renderer code cannot access Node.js APIs directly.
- **Node Integration** is disabled in the renderer (`nodeIntegration: false`).
- All renderer ↔ main communication goes through the **preload bridge** (`preload.js`).
- External URL navigation is handled via `shell.openExternal()` and restricted to a **trusted origins** whitelist (`API_BASE_URL`, `WEB_APP_URL`, `https://fieldtrack.app`).
- Permissions for `camera`, `geolocation`, `media`, and `display-capture` are granted explicitly via `setPermissionRequestHandler`.

---

## Troubleshooting

### App doesn't start / blank screen

- Verify `.env` exists and contains valid `API_BASE_URL` and `WEB_APP_URL`.
- Run `npm run dev` to open DevTools and inspect console errors.

### Geolocation returns `error: unavailable` on Windows

- Ensure **Location Services** are enabled in Windows Settings → Privacy → Location.
- The app uses the Windows `System.Device.Location` API via PowerShell. If it's blocked by policy, it falls back to IP-based location automatically.

### Screenshot capture fails on macOS

- Go to **System Settings → Privacy & Security → Screen Recording** and grant permission to FieldTrack.

### Build fails with `electron-builder` not found

```bash
npm install --save-dev electron-builder
```

### NSIS installer is too large

- Ensure `asar: true` and `compression: "maximum"` are set in `package.json`.
- Double-check the `files` array to exclude unnecessary directories.
- Run `npm prune --production` before building to strip dev dependencies (electron-builder does this automatically).

### `app.setLoginItemSettings` not working on Windows

- The app must be installed (not run from source) for auto-login to be registered in the Windows Registry.

---

## Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `npm start` | Launch the app (GPU disabled) |
| `dev`   | `npm run dev` | Launch with Node.js inspector on port 5858 |
| `build` | `npm run build` | Package the app with `electron-builder` |

---

