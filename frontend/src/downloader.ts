export class Downloader {
    downloadCSV(headers: string[], rows: string[][]): void {
        const escapedHeaders = headers.map((h) => this.escapeCSV(h));
        const escapedRows = rows.map((r) => r.map((c) => this.escapeCSV(c)));
        const csv = [escapedHeaders.join(','), ...escapedRows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'historial-respuestas.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    private escapeCSV(value: string): string {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }
}
