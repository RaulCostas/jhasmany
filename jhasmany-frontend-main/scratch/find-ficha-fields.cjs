const fs = require('fs');
const content = fs.readFileSync('src/components/PacienteForm.tsx', 'utf8');
const regex = /fichaClinica\?.(\w+)/g;
const fields = new Set();
let match;
while ((match = regex.exec(content)) !== null) {
  fields.add(match[1]);
}
console.log('Ficha Clinica Fields found in PacienteForm.tsx:', Array.from(fields));
