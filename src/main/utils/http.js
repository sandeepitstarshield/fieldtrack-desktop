'use strict';

const https = require('https');
const http = require('http');

function fetchJson(url, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        function doRequest(currentUrl, redirectsLeft) {
            const mod = currentUrl.startsWith('https') ? https : http;
            mod.get(currentUrl, { headers: { 'User-Agent': 'FieldTrack-App/1.0' } }, (res) => {
                if ((res.statusCode === 301 || res.statusCode === 302 ||
                    res.statusCode === 307 || res.statusCode === 308) &&
                    res.headers.location && redirectsLeft > 0) {
                    res.resume();
                    doRequest(res.headers.location, redirectsLeft - 1);
                    return;
                }
                let raw = '';
                res.on('data', chunk => { raw += chunk; });
                res.on('end', () => {
                    try { resolve(JSON.parse(raw)); }
                    catch (e) { reject(new Error(`JSON parse failed (status ${res.statusCode}): ${raw.slice(0, 100)}`)); }
                });
            }).on('error', reject);
        }
        doRequest(url, maxRedirects);
    });
}

module.exports = {
    fetchJson
};
