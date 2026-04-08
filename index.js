'use strict';

// Load environment variables from .env
require('dotenv').config();

const { app, ipcMain, nativeTheme, Tray, nativeImage, powerMonitor } = require('electron');
const path = require('path');
const { createMainWindow, getMainWindow } = require('./src/main/window.js');
const { registerLocationIPC } = require('./src/main/ipc/location.js');
const { registerScreenshotIPC } = require('./src/main/ipc/screenshot.js');

let tray = null;
let isQuitting = false;
let authContext = { token: null, isClockedIn: false };

process.env.GOOGLE_API_KEY = 'no';
process.env.GOOGLE_DEFAULT_CLIENT_ID = 'no';
process.env.GOOGLE_DEFAULT_CLIENT_SECRET = 'no';
app.commandLine.appendSwitch('disable-features', 'NetworkLocationProvider');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

const res = (...parts) => path.join(__dirname, ...parts);

function buildTrayIcon() {
    try {
        const img = nativeImage.createFromPath(res('assets', 'icons', 'tray-icon.png'));
        if (!img.isEmpty()) return img;
        const appImg = nativeImage.createFromPath(res('assets', 'icons', 'app-icon.png'));
        if (!appImg.isEmpty()) return appImg;
    } catch (_) { }
    return nativeImage.createEmpty();
}

async function clockOutOnShutdown() {
    if (!authContext.token || !authContext.isClockedIn) return;
    try {
        const base = process.env.API_BASE_URL || 'http://localhost:3000';
        await fetch(`${base}/api/v1/attendance/clock-out`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authContext.token}` },
            body: JSON.stringify({}),
        });
    } catch (err) {
        console.error('[shutdown clock-out]', err);
    }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        const mw = getMainWindow();
        if (mw) { if (!mw.isVisible()) mw.show(); mw.focus(); }
    });
}

app.on('window-all-closed', e => e.preventDefault());
app.on('activate', () => { const mw = getMainWindow(); if (mw) { mw.show(); mw.focus(); } });
app.on('before-quit', () => { isQuitting = true; });

app.whenReady().then(() => {
    registerLocationIPC();
    registerScreenshotIPC();

    ipcMain.on('window-minimize', () => getMainWindow()?.minimize());
    ipcMain.on('window-close', () => getMainWindow()?.hide());
    ipcMain.on('update-auth-context', (_e, ctx) => { authContext = { ...authContext, ...ctx }; });

    ipcMain.handle('navigate', (_event, page) => {
        const mw = getMainWindow();
        const allowed = ['login.html', 'clockin.html'];
        if (!allowed.includes(page) || !mw) return;
        mw.loadFile(res(page));
        if (page === 'clockin.html') {
            mw.setMinimumSize(760, 560); mw.setSize(900, 680);
        } else {
            mw.setMinimumSize(380, 520); mw.setSize(420, 600);
        }
    });

    ipcMain.handle('get-theme', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

    nativeTheme.themeSource = 'system';
    app.setLoginItemSettings({ openAtLogin: true });

    tray = new Tray(buildTrayIcon());
    tray.setToolTip('FieldTrack — Workforce Platform');
    tray.on('double-click', () => { 
        const mw = getMainWindow();
        if (mw) { mw.show(); mw.focus(); }
    });

    nativeTheme.on('updated', () => {
        getMainWindow()?.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
    });

    powerMonitor.on('shutdown', async (e) => {
        if (authContext.token && authContext.isClockedIn) {
            if (e?.preventDefault) e.preventDefault();
            await clockOutOnShutdown();
        }
    });

    createMainWindow(__dirname);
});