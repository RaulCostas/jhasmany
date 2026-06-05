const { Client } = require('pg');

async function inspect() {
    const client = new Client({
        host: 'localhost',
        port: 5433,
        user: 'postgres',
        password: 'postgrespg',
        database: 'jhasmany'
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        // Query recipe 4
        const recipeRes = await client.query('SELECT * FROM receta WHERE id = 4');
        console.log('--- Recipe 4 ---');
        console.log(recipeRes.rows[0]);

        // Query signatures for recipe 4
        const signaturesRes = await client.query("SELECT id, \"tipoDocumento\", \"documentoId\", \"rolFirmante\", substring(\"firmaData\" from 1 for 100) as data_start FROM firmas_digitales WHERE \"tipoDocumento\" = 'receta' AND \"documentoId\" = 4");
        console.log('--- Signatures for Recipe 4 ---');
        console.log(signaturesRes.rows);

        // Query signatures for user
        const userId = recipeRes.rows[0]?.user_id;
        if (userId) {
            const userSignaturesRes = await client.query(`SELECT id, "tipoDocumento", "documentoId", "rolFirmante", substring("firmaData" from 1 for 100) as data_start FROM firmas_digitales WHERE "tipoDocumento" = 'usuario' AND "documentoId" = ${userId}`);
            console.log('--- User Signatures ---');
            console.log(userSignaturesRes.rows);
        }

    } catch (err) {
        console.error('Error during inspection:', err);
    } finally {
        await client.end();
    }
}

inspect();
