const fs = require('fs');

const path = 'C:\\Users\\raulc\\.gemini\\antigravity\\brain\\416bb180-49c8-4543-a3ce-60a8eabc6830\\media__1780362736520.png';

fs.open(path, 'r', (err, fd) => {
  if (err) throw err;
  const buffer = Buffer.alloc(8);
  fs.read(fd, buffer, 0, 8, 16, (err, bytesRead) => {
    if (err) throw err;
    const width = buffer.readInt32BE(0);
    const height = buffer.readInt32BE(4);
    console.log(`Width: ${width}, Height: ${height}`);
    fs.close(fd, () => {});
  });
});
