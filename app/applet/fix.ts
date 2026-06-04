import fs from 'fs';
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

const lines = code.split('\n');

const startChunk = 1475;
const endChunk = 1485;

console.log(lines.slice(startChunk, endChunk).map(l => '"' + l + '"').join('\n'));

// Let's modify the lines
lines.splice(1478, 3); // Remove lines 1478, 1479, 1480

// Now for line 1529: '                                         </div></div>'
const line1529Idx = lines.findIndex((l, i) => i > 1500 && l.includes('</div></div>'));
if (line1529Idx !== -1) {
    lines[line1529Idx] = lines[line1529Idx].replace('</div></div>', '</div>');
}

fs.writeFileSync('/app/applet/src/App.tsx', lines.join('\n'));
console.log('Fixed file');
