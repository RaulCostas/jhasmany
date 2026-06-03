const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgrespg',
  database: 'jhasmany',
});

async function main() {
  await client.connect();
  console.log('Connected to the database');
  
  const totalRes = await client.query('SELECT COUNT(*) FROM "medicamento";');
  console.log('Total rows in medicamento table:', totalRes.rows[0].count);

  const sampleRes = await client.query('SELECT id, medicamento, estado FROM "medicamento" LIMIT 20;');
  console.log('Sample rows:', sampleRes.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
