import { describe, it, expect, jest } from '@jest/globals';
import { Downloader } from '../src/downloader';

describe('Downloader', () => {
    let downloader: Downloader;
    let blobCreadoPorDownloader: Blob | undefined;
    let enlacesCreados: HTMLAnchorElement[];
    let createObjectURLOriginal: typeof URL.createObjectURL;
    let revokeObjectURLOriginal: typeof URL.revokeObjectURL;
    let createElementOriginal: typeof document.createElement;

    function guardarBlobYRetornarMockURL(blob: Blob): string {
        blobCreadoPorDownloader = blob;
        return 'blob:mock-url';
    }

    function capturarEnlaceCreado(tagName: string): HTMLElement {
        if (tagName === 'a') {
            const enlace = { href: '', click: jest.fn() } as unknown as HTMLAnchorElement;
            enlacesCreados.push(enlace);
            return enlace;
        }
        return createElementOriginal(tagName);
    }

    function obtenerTextoDelBlob(): Promise<string> {
        if (!blobCreadoPorDownloader) return Promise.resolve('');
        const reader = new FileReader();
        return new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Error al leer el blob'));
            reader.readAsText(blobCreadoPorDownloader as Blob);
        });
    }

    beforeEach(() => {
        downloader = new Downloader();
        blobCreadoPorDownloader = undefined;
        enlacesCreados = [];
        createObjectURLOriginal = URL.createObjectURL;
        revokeObjectURLOriginal = URL.revokeObjectURL;
        createElementOriginal = document.createElement;
        URL.createObjectURL = guardarBlobYRetornarMockURL as typeof URL.createObjectURL;
        URL.revokeObjectURL = jest.fn() as unknown as typeof URL.revokeObjectURL;
        document.createElement = capturarEnlaceCreado as unknown as typeof document.createElement;
    });

    afterEach(() => {
        URL.createObjectURL = createObjectURLOriginal;
        URL.revokeObjectURL = revokeObjectURLOriginal;
        document.createElement = createElementOriginal;
    });

    it('genera CSV con encabezados y filas', async () => {
        downloader.downloadCSV(
            ['Nombre', 'Edad'],
            [['Alice', '30'], ['Bob', '25']]
        );

        const csv = await obtenerTextoDelBlob();
        const lineas = csv.split('\n');
        expect(lineas[0]).toBe('Nombre,Edad');
        expect(lineas[1]).toBe('Alice,30');
        expect(lineas[2]).toBe('Bob,25');
    });

    it('escapa valores con comas envolviendolos en comillas dobles', async () => {
        downloader.downloadCSV(
            ['Ciudad', 'Descripcion'],
            [['Madrid, España', 'Capital']]
        );

        const csv = await obtenerTextoDelBlob();
        expect(csv).toContain('"Madrid, España"');
    });

    it('escapa comillas dobles duplicandolas', async () => {
        downloader.downloadCSV(
            ['Nota'],
            [['Dijo "hola"']]
        );

        const csv = await obtenerTextoDelBlob();
        expect(csv).toContain('"Dijo ""hola"""');
    });

    it('escapa valores con saltos de linea', async () => {
        downloader.downloadCSV(
            ['Comentario'],
            [['linea1\nlinea2']]
        );

        const csv = await obtenerTextoDelBlob();
        expect(csv).toContain('"linea1\nlinea2"');
    });

    it('genera solo encabezados cuando no hay filas', async () => {
        downloader.downloadCSV(['A', 'B'], []);

        const csv = await obtenerTextoDelBlob();
        const lineas = csv.split('\n');
        expect(lineas[0]).toBe('A,B');
        expect(lineas.length).toBe(1);
    });

    it('genera CSV con celdas vacias', async () => {
        downloader.downloadCSV(
            ['A', 'B'],
            [['', 'solo']]
        );

        const csv = await obtenerTextoDelBlob();
        expect(csv).toContain(',solo');
    });

    it('escapa encabezados con caracteres especiales', async () => {
        downloader.downloadCSV(
            ['Nombre, completo', 'Edad'],
            [['Alice', '30']]
        );

        const csv = await obtenerTextoDelBlob();
        expect(csv).toContain('"Nombre, completo"');
    });

    it('crea un enlace con la URL del blob, asigna nombre de archivo y hace click', () => {
        downloader.downloadCSV(['A'], [['1']]);

        expect(enlacesCreados.length).toBe(1);
        expect(enlacesCreados[0].href).toBe('blob:mock-url');
        expect(enlacesCreados[0].download).toBe('historial-respuestas.csv');
        expect(enlacesCreados[0].click).toHaveBeenCalledTimes(1);
    });

    it('libera la URL del blob llamando a revokeObjectURL', () => {
        downloader.downloadCSV(['A'], [['1']]);

        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
});
