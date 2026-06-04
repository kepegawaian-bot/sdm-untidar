import fs from 'fs';
import path from 'path';

let targetFile = path.resolve('src/App.tsx');
if (!fs.existsSync(targetFile)) {
    targetFile = '/src/App.tsx';
}

let code = fs.readFileSync(targetFile, 'utf8');

const lines = code.split('\n');

const testLines = lines.slice(1475, 1485);
console.log(testLines);

if (lines[1478].includes('</div>') && lines[1479].includes('</div>')) {
    lines.splice(1478, 3);
}

const line1529Idx = lines.findIndex((l, i) => i > 1500 && l.includes('</div></div>'));
if (line1529Idx !== -1) {
    lines[line1529Idx] = lines[line1529Idx].replace('</div></div>', '</div>');
}

fs.writeFileSync(targetFile, lines.join('\n'));
console.log('Fixed file');
