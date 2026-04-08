'use strict';

const { ipcMain } = require('electron');
const { exec } = require('child_process');
const { fetchJson } = require('../utils/http');

function registerLocationIPC() {
    ipcMain.handle('get-geolocation', async () => {
        if (process.platform === 'win32') {
            try {
                const winLoc = await getWindowsLocation();
                if (winLoc && !winLoc.error) {
                    console.log('[geo] native windows success:', winLoc);
                    return { ...winLoc, source: 'windows' };
                }
            } catch (e) {
                console.warn('[geo] native windows failed:', e.message);
            }
        }

        console.log('[geo] falling back to IP geolocation...');
        
        try {
            const d = await fetchJson('https://ipinfo.io/json');
            if (d.loc) {
                const [lat, lng] = d.loc.split(',').map(Number);
                console.log('[geo] ipinfo.io success: lat=', lat, 'lng=', lng);
                return { lat, lng, accuracy: 5000, source: 'ip' };
            }
        } catch (e) {
            console.warn('[geo] ipinfo.io failed:', e.message);
        }

        try {
            const d = await fetchJson('http://ip-api.com/json?fields=lat,lon,status,message');
            if (d.status === 'success') {
                return { lat: d.lat, lng: d.lon, accuracy: 5000, source: 'ip' };
            }
        } catch (e) {
            console.warn('[geo] ip-api.com failed:', e.message);
        }

        return { error: 'Could not determine location' };
    });
}

function getWindowsLocation() {
    return new Promise((resolve, reject) => {
        const psCommand = `
            Add-Type -AssemblyName System.Device;
            $Watcher = New-Object System.Device.Location.GeoCoordinateWatcher;
            $Watcher.Start();
            $maxWait = 40;
            while (($Watcher.Status -ne 'Ready') -and ($Watcher.Permission -ne 'Denied') -and ($maxWait -gt 0)) {
                Start-Sleep -Milliseconds 100;
                $maxWait--;
            };
            $pos = $Watcher.Position.Location;
            if ($pos.IsUnknown) {
                Write-Output "error:unknown";
            } else {
                Write-Output "$($pos.Latitude),$($pos.Longitude),$($pos.HorizontalAccuracy)";
            }
        `.replace(/\n/g, ' ');

        exec(`powershell -Command "${psCommand}"`, (err, stdout, stderr) => {
            if (err || stderr) return resolve({ error: 'unavailable' });
            const output = stdout.trim();
            if (output.startsWith('error') || output === '') return resolve({ error: 'unavailable' });
            
            const [lat, lng, acc] = output.split(',').map(Number);
            if (isNaN(lat) || isNaN(lng)) return resolve({ error: 'parse_failed' });
            
            resolve({ lat, lng, accuracy: acc });
        });
    });
}

module.exports = {
    registerLocationIPC
};
