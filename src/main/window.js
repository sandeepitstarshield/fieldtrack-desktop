'use strict';

const { BrowserWindow, session, desktopCapturer, shell, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;

function res(basePath, ...parts) {
    return path.join(basePath, ...parts);
}

function buildAppIcon(basePath) {
    const iconPath = process.platform === 'win32'
        ? res(basePath, 'assets', 'icons', 'app-icon.ico')
        : process.platform === 'darwin'
            ? res(basePath, 'assets', 'icons', 'app-icon.icns')
            : res(basePath, 'assets', 'icons', 'app-icon.png');
    
    try {
        const img = nativeImage.createFromPath(iconPath);
        if (!img.isEmpty()) return img;
    } catch (_) { }
    
    try {
        const fallback = nativeImage.createFromPath(res(basePath, 'assets', 'icons', 'app-icon.png'));
        if (!fallback.isEmpty()) return fallback;
    } catch (_) { }
    
    return nativeImage.createEmpty();
}

function createMainWindow(basePath) {
    const splash = new BrowserWindow({
        width: 400, height: 300,
        transparent: true, frame: false,
        alwaysOnTop: true, resizable: false,
        icon: buildAppIcon(basePath),
    });
    
    splash.loadFile(res(basePath, 'splash.html')).catch(() => {
        if (!splash.isDestroyed()) splash.close();
    });

    mainWindow = new BrowserWindow({
        width: 420, height: 600,
        minWidth: 380, minHeight: 520,
        show: false,
        frame: false,
        icon: buildAppIcon(basePath),
        webPreferences: {
            preload: res(basePath, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    const ALLOWED_PERMISSIONS = new Set(['camera', 'geolocation', 'media', 'display-capture']);
    session.defaultSession.setPermissionRequestHandler((_wc, perm, cb) => {
        cb(ALLOWED_PERMISSIONS.has(perm));
    });
    session.defaultSession.setPermissionCheckHandler((_wc, perm) => {
        return ALLOWED_PERMISSIONS.has(perm);
    });

    session.defaultSession.setDisplayMediaRequestHandler((_req, cb) => {
        desktopCapturer
            .getSources({ types: ['screen'] })
            .then(sources => { if (sources?.length) cb({ video: sources[0], audio: 'loopback' }); })
            .catch(err => console.error('[displayMedia]', err));
    });

    mainWindow.loadFile(res(basePath, 'login.html'));

    mainWindow.webContents.once('did-finish-load', () => {
        if (!splash.isDestroyed()) splash.close();
        mainWindow.show();
    });

    const TRUSTED_ORIGINS = [
        process.env.API_BASE_URL || 'http://localhost:3000',
        process.env.WEB_APP_URL  || 'http://localhost:3001',
        'https://fieldtrack.app',
    ];
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        try {
            const origin = new URL(url).origin;
            if (TRUSTED_ORIGINS.some(t => origin === t || url.startsWith(t))) {
                shell.openExternal(url);
            }
        } catch (_) { }
        return { action: 'deny' };
    });

    return mainWindow;
}

module.exports = {
    createMainWindow,
    getMainWindow: () => mainWindow
};
