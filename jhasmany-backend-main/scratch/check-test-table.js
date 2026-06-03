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
  console.log('Connected to database.');

  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('Tables in database:');
    res.rows.forEach(row => {
      console.log(` - ${row.table_name}`);
    });
  } catch (err) {
    console.error('Error listing tables:', err.message);
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error(err);
});
