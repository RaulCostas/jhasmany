const fs = require('fs');
const content = fs.readFileSync('src/components/PacienteList.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.toLowerCase().includes('imprimir') || line.toLowerCase().includes('ficha')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
