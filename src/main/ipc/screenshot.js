'use strict';

const { ipcMain, desktopCapturer, systemPreferences } = require('electron');

function registerScreenshotIPC() {
    ipcMain.handle('capture-screenshot', async () => {
        if (process.platform === 'darwin') {
            if (systemPreferences.getMediaAccessStatus('screen') !== 'granted') {
                console.warn('[screenshot] Screen permission not granted on macOS.');
            }
        }
        try {
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: { width: 1920, height: 1080 },
            });
            if (sources?.length) return sources[0].thumbnail.toDataURL();
        } catch (err) {
            console.error('[screenshot]', err);
        }
        return null;
    });
}

module.exports = {
    registerScreenshotIPC
};
