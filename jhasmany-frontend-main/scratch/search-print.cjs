const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function searchFiles(dir, term) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchFiles(fullPath, term);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(term.toLowerCase())) {
        console.log(`Found "${term}" in: ${fullPath}`);
      }
    }
  }
}

console.log('Searching for "Imprimir" or "Ficha" in src...');
searchFiles(srcDir, 'Imprimir');
searchFiles(srcDir, 'Ficha');
searchFiles(srcDir, 'PacienteTabFicha');
