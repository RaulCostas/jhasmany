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
    } else if (file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(term)) {
        console.log(`Found ${term} in: ${fullPath}`);
      }
    }
  }
}

searchFiles(srcDir, 'JwtAuthGuard');
searchFiles(srcDir, 'APP_GUARD');
