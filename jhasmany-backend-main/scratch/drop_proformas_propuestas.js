const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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
            let val = match[2].trim();
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

const tablesToDrop = [
    'propuesta_detalle',
    'propuestas',
    'proforma_detalle',
    'proformas_imagenes',
    'recordatorio_plan',
    'proformas'
];

async function main() {
    try {
        await client.connect();
        console.log('Connected to database.');

        console.log('\n--- Dropping Obsolete Tables ---');
        for (const table of tablesToDrop) {
            try {
                await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
                console.log(`Dropped table: ${table}`);
            } catch (e) {
                console.error(`Error dropping table ${table}:`, e.message);
            }
        }

        console.log('\n--- Dropping Obsolete Columns ---');
        
        // Remove columns from historia_clinica
        try {
            await client.query('ALTER TABLE "historia_clinica" DROP COLUMN IF EXISTS "proformaId" CASCADE;');
            console.log('Dropped "proformaId" from "historia_clinica"');
        } catch (e) {
            console.error('Error dropping "proformaId" from "historia_clinica":', e.message);
        }

        try {
            await client.query('ALTER TABLE "historia_clinica" DROP COLUMN IF EXISTS "proformaDetalleId" CASCADE;');
            console.log('Dropped "proformaDetalleId" from "historia_clinica"');
        } catch (e) {
            console.error('Error dropping "proformaDetalleId" from "historia_clinica":', e.message);
        }

        try {
            await client.query('ALTER TABLE "historia_clinica" DROP COLUMN IF EXISTS "estadoPresupuesto" CASCADE;');
            console.log('Dropped "estadoPresupuesto" from "historia_clinica"');
        } catch (e) {
            console.error('Error dropping "estadoPresupuesto" from "historia_clinica":', e.message);
        }

        // Remove columns from pagos
        try {
            await client.query('ALTER TABLE "pagos" DROP COLUMN IF EXISTS "proformaId" CASCADE;');
            console.log('Dropped "proformaId" from "pagos"');
        } catch (e) {
            console.error('Error dropping "proformaId" from "pagos":', e.message);
        }

        console.log('\nDone database cleanup.');
    } catch (err) {
        console.error('Database connection error:', err);
    } finally {
        await client.end();
    }
}

main();
