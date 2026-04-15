#!/usr/bin/env node

/**
 * Generates MongoDB import script for users from CSV
 * Parses CSV and hashes passwords using bcrypt
 * 
 * Usage: node generate-users.js <csv_file> <role> <commission>
 */

const fs = require('fs');
const bcrypt = require('bcrypt');

const [csvFile, role, commission] = process.argv.slice(2);

if (!csvFile || !role || !commission) {
    console.error('Usage: node generate-users.js <csv_file> <role> <commission>');
    process.exit(1);
}

const BCRYPT_COST = 12;

// Simple CSV parser that handles quoted fields with commas
function parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                fields.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
    }
    fields.push(current.trim());
    
    return fields;
}

// Escape for JavaScript string literals
const escapeJs = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

function main() {
    // Read CSV
    const csvContent = fs.readFileSync(csvFile, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Skip header
    const dataLines = lines.slice(1);

    for (const line of dataLines) {
        if (!line.trim()) continue;
        
        const row = parseCSVLine(line);
        if (row.length < 5) continue;
        
        const nombre = row[1];
        const dni = row[2];
        const emailUnlam = row[4];
        
        // Skip if essential fields are empty
        if (!emailUnlam || !dni || !nombre) continue;
        
        // Hash password (synchronous)
        const hashedPassword = bcrypt.hashSync(dni, BCRYPT_COST);
        
        const emailEscaped = escapeJs(emailUnlam);
        const nameEscaped = escapeJs(nombre);
        const hashedPasswordEscaped = escapeJs(hashedPassword);
        const roleEscaped = escapeJs(role);
        const commissionEscaped = escapeJs(commission);
        
        console.log(`try {
    const result = db.users.updateOne(
        { email: '${emailEscaped}' },
        {
            $set: {
                email: '${emailEscaped}',
                password: '${hashedPasswordEscaped}',
                name: '${nameEscaped}',
                role: '${roleEscaped}',
                commission: '${commissionEscaped}'
            },
            $setOnInsert: { createdAt: new Date(), streak: 0, failedLoginAttempts: 0 }
        },
        { upsert: true }
    );

    if (result.upsertedId) {
        print('INSERTED');
    } else if (result.matchedCount > 0) {
        print('UPDATED');
    }
} catch (e) {
    print('ERROR: ' + e.message);
}`);
    }
}

main();
