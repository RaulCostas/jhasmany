const { Client } = require('pg');
const axios = require('axios');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgrespg',
  database: 'jhasmany',
});

const API_URL = 'http://localhost:3000';

async function main() {
  await client.connect();
  console.log('Connected to database.');

  // 1. Get a valid patient
  const patientRes = await client.query('SELECT id, nombre, paterno, materno FROM "pacientes" LIMIT 1;');
  if (patientRes.rows.length === 0) {
    console.log('No patients found in database. Cannot run integration test.');
    await client.end();
    return;
  }
  const patient = patientRes.rows[0];
  console.log(`Using patient for test: ID=${patient.id}, Name=${patient.nombre} ${patient.paterno}`);

  // 2. Generate a test using backend API
  console.log('\n--- Step 1: Generating test via API POST /paciente-test/enviar ---');
  let testResponse;
  try {
    testResponse = await axios.post(`${API_URL}/paciente-test/enviar`, {
      pacienteId: patient.id
    });
    console.log('Test generated successfully:', testResponse.data);
  } catch (err) {
    console.error('Error generating test:', err.response?.data || err.message);
    await client.end();
    return;
  }

  const { token, id: testId } = testResponse.data;
  console.log(`Token: ${token}, Test ID: ${testId}`);

  // 3. Retrieve public details via API
  console.log('\n--- Step 2: Retrieving public test details via GET /paciente-test/public/:token ---');
  try {
    const publicRes = await axios.get(`${API_URL}/paciente-test/public/${token}`);
    console.log('Public details retrieved:', publicRes.data);
  } catch (err) {
    console.error('Error retrieving public details:', err.response?.data || err.message);
    await client.end();
    return;
  }

  // 4. Submit answers via API
  console.log('\n--- Step 3: Submitting answers via POST /paciente-test/public/:token/responder ---');
  // Rosenberg scale answers
  // Positive questions (1, 3, 4, 6, 7): Let's select "De acuerdo" (3) -> (3-1) = 2 pts each (5 * 2 = 10 pts)
  // Negative questions (2, 5, 8, 9, 10): Let's select "En desacuerdo" (2) -> (4-2) = 2 pts each (5 * 2 = 10 pts)
  // Expected score = 20 pts.
  // Interpretation for 20 pts: "Autoestima media. Consideras que vales, aunque tienes altibajos o momentos de inseguridad."
  const answers = {
    1: 3, // +2
    2: 2, // +2
    3: 3, // +2
    4: 3, // +2
    5: 2, // +2
    6: 3, // +2
    7: 3, // +2
    8: 2, // +2
    9: 2, // +2
    10: 2 // +2
  };

  try {
    const submitRes = await axios.post(`${API_URL}/paciente-test/public/${token}/responder`, {
      respuestas: answers
    });
    console.log('Submit response:', submitRes.data);
    
    console.log('\nAsserting results:');
    console.log(` - Expected Score: 20, Got: ${submitRes.data.score}`);
    console.log(` - Expected Result: "Autoestima media. Consideras que vales, aunque tienes altibajos o momentos de inseguridad."`);
    console.log(` - Got Result: "${submitRes.data.result}"`);
    
    if (submitRes.data.score === 20 && submitRes.data.result.includes('Autoestima media')) {
      console.log('\n>>> SUCCESS: Rosenberg scoring math and interpretation matches! <<<');
    } else {
      console.error('\n>>> ERROR: Mismatch in score or interpretation. <<<');
    }
  } catch (err) {
    console.error('Error submitting answers:', err.response?.data || err.message);
    await client.end();
    return;
  }

  // 5. Query database to verify record is updated
  console.log('\n--- Step 4: Verifying database state ---');
  try {
    const dbRes = await client.query('SELECT * FROM paciente_tests WHERE id = $1;', [testId]);
    const row = dbRes.rows[0];
    console.log('Database row contents:');
    console.log(` - ID: ${row.id}`);
    console.log(` - Estado: ${row.estado}`);
    console.log(` - Puntaje: ${row.puntaje}`);
    console.log(` - Resultado: ${row.resultado}`);
    console.log(` - Respuestas:`, row.respuestas);
    console.log(` - Fecha Completado: ${row.fecha_completado}`);
  } catch (err) {
    console.error('Database query error:', err.message);
  }

  await client.end();
  console.log('\nVerification flow completed.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
