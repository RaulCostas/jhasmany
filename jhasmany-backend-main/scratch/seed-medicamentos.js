const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { Client } = require('pg');

const excelPath = path.join(__dirname, '..', '..', 'medicamentos.xlsx');
console.log('Looking for Excel file at:', excelPath);

if (!fs.existsSync(excelPath)) {
  console.error('Excel file not found!');
  process.exit(1);
}

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgrespg',
  database: 'jhasmany',
});

async function main() {
  // 1. Read Excel file
  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Read sheet as an array of arrays to avoid missing the first row (treated as header by default)
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  console.log(`Total rows read from Excel sheet "${sheetName}" (including first row): ${rows.length}`);
  
  if (rows.length === 0) {
    console.error('No rows found in Excel sheet.');
    process.exit(1);
  }

  // Extract all medicine names from the first column of each row
  const medicines = [];
  for (const row of rows) {
    if (Array.isArray(row) && row.length > 0) {
      const name = String(row[0] || '').trim();
      if (name.length > 0) {
        medicines.push(name);
      }
    }
  }

  console.log(`Found ${medicines.length} non-empty medicine names to insert.`);
  console.log('First 5 medicines from parsed list:', medicines.slice(0, 5));

  // 2. Database Connection and Operations
  await client.connect();
  console.log('Connected to PostgreSQL database');

  try {
    // Reset ID counter and clear the table as requested by the user
    console.log('Resetting "medicamento" table and its ID counter...');
    await client.query('TRUNCATE TABLE "medicamento" RESTART IDENTITY CASCADE;');
    console.log('Table truncated and identity restarted.');

    // Insert medicines
    let insertedCount = 0;
    
    // Using a transaction for speed and safety
    await client.query('BEGIN;');
    
    for (const medName of medicines) {
      // Check if medicine already exists (should not since we truncated, but good practice)
      const checkRes = await client.query('SELECT id FROM "medicamento" WHERE medicamento = $1;', [medName]);
      if (checkRes.rows.length === 0) {
        await client.query('INSERT INTO "medicamento" (medicamento, estado) VALUES ($1, $2);', [medName, 'activo']);
        insertedCount++;
      }
    }
    
    await client.query('COMMIT;');
    console.log(`Successfully inserted ${insertedCount} unique medicines.`);

    // Log a few inserted records as proof
    const verifyRes = await client.query('SELECT id, medicamento FROM "medicamento" ORDER BY id ASC LIMIT 10;');
    console.log('First 10 records in "medicamento" table:');
    console.log(verifyRes.rows);

    const totalCountRes = await client.query('SELECT COUNT(*) FROM "medicamento";');
    console.log(`Total records now in "medicamento" table: ${totalCountRes.rows[0].count}`);

  } catch (error) {
    await client.query('ROLLBACK;');
    console.error('Error during database operations:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

main().catch(err => {
  console.error('Main thread error:', err);
  process.exit(1);
});
