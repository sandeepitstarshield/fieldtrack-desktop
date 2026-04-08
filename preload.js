
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Read from environment (populated by dotenv in index.js)
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const WEB_APP_URL  = process.env.WEB_APP_URL  || 'http://localhost:3001';

contextBridge.exposeInMainWorld('fieldtrack', {
    // ── Config ──────────────────────────────────────────────────────────
    apiBaseUrl: API_BASE_URL,
    webAppUrl:  WEB_APP_URL,

    // ── IPC ─────────────────────────────────────────────────────────────
    captureScreenshot: () => ipcRenderer.invoke('capture-screenshot'),

    navigate: (page) => ipcRenderer.invoke('navigate', page),

    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    closeWindow:    () => ipcRenderer.send('window-close'),

    updateAuthContext: (ctx) => ipcRenderer.send('update-auth-context', ctx),

    onThemeChanged: (cb) => ipcRenderer.on('theme-changed', (_e, theme) => cb(theme)),

    getGeolocation: () => ipcRenderer.invoke('get-geolocation'),
});