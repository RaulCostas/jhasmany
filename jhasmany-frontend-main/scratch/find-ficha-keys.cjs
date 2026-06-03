const fs = require('fs');
const content = fs.readFileSync('src/components/PacienteForm.tsx', 'utf8');

// find lines containing "ficha"
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('ficha') && line.includes('enf_actual') || line.includes('patologia_') || line.includes('examen_vit_')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
