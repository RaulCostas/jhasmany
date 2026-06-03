const fs = require('fs');
const content = fs.readFileSync('src/components/PrintFilterModal.tsx', 'utf8');

const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('ficha') || line.toLowerCase().includes('paciente')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
