import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swPath = path.resolve(__dirname, '../public/sw.js');
const swContent = fs.readFileSync(swPath, 'utf-8');

describe('Service Worker', () => {
    it('deberia contener skipWaiting para activarse inmediatamente al instalarse', () => {
        expect(swContent).toContain('self.skipWaiting()');
    });

    it('deberia contener clients.claim para tomar control inmediato al activarse', () => {
        expect(swContent).toContain('self.clients.claim()');
    });

    it('deberia usar network-first cuando la request es de navegacion', () => {
        expect(swContent).toContain("request.mode === 'navigate'");
        const navigateBlock = swContent.substring(
            swContent.indexOf("request.mode === 'navigate'"),
            swContent.indexOf("request.mode === 'navigate'") + 300
        );
        expect(navigateBlock).toContain('fetch(request)');
        expect(navigateBlock).toContain('.catch');
    });

    it('deberia usar cache-first cuando la request es de un asset estatico', () => {
        const fetchHandler = swContent.substring(swContent.indexOf("self.addEventListener('fetch'"));
        const afterNavigateReturn = fetchHandler.substring(fetchHandler.indexOf('return;') + 7);
        expect(afterNavigateReturn).toContain('caches.match(request)');
    });

    it('deberia limpiar caches viejos al activarse', () => {
        const activateHandler = swContent.substring(
            swContent.indexOf("self.addEventListener('activate'"),
            swContent.indexOf("self.addEventListener('fetch'")
        );
        expect(activateHandler).toContain('caches.keys()');
        expect(activateHandler).toContain('caches.delete');
    });

    it('deberia versionar el cache con v2 para invalidar caches anteriores', () => {
        expect(swContent).toContain("CACHE_NAME = 'mascota-virtual-v2'");
    });
});
