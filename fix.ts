import fs from 'fs';
let code = fs.readFileSync('/src/App.tsx', 'utf8');

const lines = code.split('\n');

lines.splice(1478, 3);

const line1529Idx = lines.findIndex((l, i) => i > 1500 && l.includes('</div></div>'));
if (line1529Idx !== -1) {
    lines[line1529Idx] = lines[line1529Idx].replace('</div></div>', '</div>');
}

fs.writeFileSync('/src/App.tsx', lines.join('\n'));
console.log('Fixed file');
