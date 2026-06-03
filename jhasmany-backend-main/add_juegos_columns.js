const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgrespg',
    database: process.env.DB_DATABASE || 'jhasmany',
});

async function main() {
    try {
        await client.connect();
        console.log("Connected to database. Adding games habit columns...");

        await client.query(`
            ALTER TABLE ficha_medica ADD COLUMN IF NOT EXISTS habito_juegos_consumo text;
            ALTER TABLE ficha_medica ADD COLUMN IF NOT EXISTS habito_juegos_frecuencia text;
            ALTER TABLE ficha_medica ADD COLUMN IF NOT EXISTS habito_juegos_cantidad text;
        `);
        console.log("Added columns successfully.");
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
