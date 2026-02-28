import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

describe('Assets', () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const publicDir = path.resolve(__dirname, '../public');

    it('deberia existir logo-contento.svg en la carpeta public', () => {
        const filePath = path.join(publicDir, 'logo-contento.svg');
        expect(fs.existsSync(filePath)).toBe(true);
    });

    it('deberia existir logo-triste.svg en la carpeta public', () => {
        const filePath = path.join(publicDir, 'logo-triste.svg');
        expect(fs.existsSync(filePath)).toBe(true);
    });

    it('deberia existir logo-neutro.svg en la carpeta public', () => {
        const filePath = path.join(publicDir, 'logo-neutro.svg');
        expect(fs.existsSync(filePath)).toBe(true);
    });

    it('deberia existir logo-contento-boca-abierta.svg en la carpeta public', () => {
        const filePath = path.join(publicDir, 'logo-contento-boca-abierta.svg');
        expect(fs.existsSync(filePath)).toBe(true);
    });

    it('deberia existir logo-triste-con-lagrimas.svg en la carpeta public', () => {
        const filePath = path.join(publicDir, 'logo-triste-con-lagrimas.svg');
        expect(fs.existsSync(filePath)).toBe(true);
    });
});
