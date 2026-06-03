const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno manualmente desde .env en jhasmany-backend-main
const envPath = path.join(__dirname, '..', '.env');
console.log('Loading env from:', envPath);
let dbConfig = {
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'postgrespg',
    database: 'jhasmany'
};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*DB_([A-Z]+)\s*=\s*(.+?)\s*$/);
        if (match) {
            const key = match[1].toLowerCase();
            let val = match[2];
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.substring(1, val.length - 1);
            }
            if (key === 'username') dbConfig.user = val;
            else if (key === 'password') dbConfig.password = val;
            else if (key === 'database') dbConfig.database = val;
            else if (key === 'host') dbConfig.host = val;
            else if (key === 'port') dbConfig.port = parseInt(val, 10);
        }
    });
}

console.log('Database Configuration:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database
});

const client = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
});

async function main() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // Check current columns of 'agenda' table
        const resColumns = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'agenda' AND table_schema = 'public';
        `);
        const columns = resColumns.rows.map(row => row.column_name);
        console.log('Current columns in "agenda":', columns);

        // 1. Rename 'tratamiento' to 'observaciones' if it exists and 'observaciones' does not
        if (columns.includes('tratamiento') && !columns.includes('observaciones')) {
            console.log('Renaming column "tratamiento" to "observaciones"...');
            await client.query('ALTER TABLE agenda RENAME COLUMN tratamiento TO observaciones;');
            console.log('Column renamed successfully.');
        } else {
            console.log('No need to rename "tratamiento" (either it does not exist or "observaciones" already exists).');
        }

        // 2. Drop 'consultorio' column if it exists
        if (columns.includes('consultorio')) {
            console.log('Dropping column "consultorio"...');
            await client.query('ALTER TABLE agenda DROP COLUMN IF EXISTS consultorio CASCADE;');
            console.log('Column "consultorio" dropped successfully.');
        }

        // 3. Drop 'pacienteSeguroId' column if it exists
        if (columns.includes('pacienteSeguroId')) {
            console.log('Dropping column "pacienteSeguroId"...');
            await client.query('ALTER TABLE agenda DROP COLUMN IF EXISTS "pacienteSeguroId" CASCADE;');
            console.log('Column "pacienteSeguroId" dropped successfully.');
        }

        // 4. Drop 'proformaId' column if it exists
        if (columns.includes('proformaId')) {
            console.log('Dropping column "proformaId"...');
            await client.query('ALTER TABLE agenda DROP COLUMN IF EXISTS "proformaId" CASCADE;');
            console.log('Column "proformaId" dropped successfully.');
        }

        // Check updated columns
        const resColumnsAfter = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'agenda' AND table_schema = 'public';
        `);
        const columnsAfter = resColumnsAfter.rows.map(row => row.column_name);
        console.log('Updated columns in "agenda":', columnsAfter);

    } catch (err) {
        console.error('Error running script:', err);
    } finally {
        await client.end();
    }
}

main();
