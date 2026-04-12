describe('CORS Configuration', () => {
    describe('parseCorsOrigins', () => {
        function parseCorsOrigins(envVar: string | undefined, fallback: string[]): string[] {
            if (!envVar) return fallback;
            return envVar.split(',').map(origin => origin.trim()).filter(Boolean);
        }

        it('should return fallback when env var is undefined', () => {
            const result = parseCorsOrigins(undefined, ['http://localhost:5173']);
            expect(result).toEqual(['http://localhost:5173']);
        });

        it('should parse comma-separated origins', () => {
            const result = parseCorsOrigins('http://localhost:5173,http://localhost:3000', []);
            expect(result).toEqual(['http://localhost:5173', 'http://localhost:3000']);
        });

        it('should trim whitespace from origins', () => {
            const result = parseCorsOrigins(' http://localhost:5173 , http://localhost:3000 ', []);
            expect(result).toEqual(['http://localhost:5173', 'http://localhost:3000']);
        });

        it('should filter empty strings', () => {
            const result = parseCorsOrigins('http://localhost:5173,,http://localhost:3000,', []);
            expect(result).toEqual(['http://localhost:5173', 'http://localhost:3000']);
        });
    });

    describe('maskMongoUri', () => {
        function maskMongoUri(uri: string): string {
            try {
                const url = new URL(uri);
                if (url.username || url.password) {
                    url.username = '***';
                    url.password = '***';
                }
                return url.toString();
            } catch {
                return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
            }
        }

        it('should mask credentials in MongoDB URI with username/password', () => {
            const uri = 'mongodb://admin:secret123@localhost:27017/tamagotchi';
            const result = maskMongoUri(uri);
            expect(result).toBe('mongodb://***:***@localhost:27017/tamagotchi');
        });

        it('should mask credentials in MongoDB+SRV URI', () => {
            const uri = 'mongodb+srv://user:password@cluster.mongodb.net/db';
            const result = maskMongoUri(uri);
            expect(result).toBe('mongodb+srv://***:***@cluster.mongodb.net/db');
        });

        it('should return URI unchanged if no credentials', () => {
            const uri = 'mongodb://localhost:27017/tamagotchi';
            const result = maskMongoUri(uri);
            expect(result).toBe(uri);
        });

        it('should handle fallback for malformed URIs', () => {
            const uri = 'mongodb://user:pass@localhost/tamagotchi';
            const result = maskMongoUri(uri);
            expect(result).toContain('***');
            expect(result).not.toContain('user');
            expect(result).not.toContain('pass');
        });
    });
});
