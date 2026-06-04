import fs from 'fs';
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

const lines = code.split('\n');

// 1475 to 1485
const startChunk = 1474;
const endChunk = 1484;

// Print exactly what we see there:
console.log(lines.slice(startChunk, endChunk).map(l => '"' + l + '"').join('\n'));
