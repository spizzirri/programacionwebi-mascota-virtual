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

// Escape for JavaScript string literals
const escapeJs = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

function processRow(row, isHeader) {
    if (isHeader) return;
    if (row.length < 5) return;
    
    const nombre = row[1];
    const dni = row[2];
    const emailUnlam = row[4];
    
    if (!emailUnlam || !dni || !nombre) return;
    
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

function main() {
    const csvContent = fs.readFileSync(csvFile, 'utf-8');
    
    let currentFields = [];
    let currentVal = '';
    let inQuotes = false;
    let isHeader = true;

    for (let i = 0; i < csvContent.length; i++) {
        const char = csvContent[i];
        
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < csvContent.length && csvContent[i + 1] === '"') {
                    currentVal += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentVal += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentFields.push(currentVal.trim());
                currentVal = '';
            } else if (char === '\n' || char === '\r') {
                if (char === '\r' && csvContent[i+1] === '\n') {
                    i++;
                }
                currentFields.push(currentVal.trim());
                processRow(currentFields, isHeader);
                isHeader = false;
                currentFields = [];
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
    }
    
    if (currentFields.length > 0 || currentVal) {
        currentFields.push(currentVal.trim());
        processRow(currentFields, isHeader);
    }
}

main();
