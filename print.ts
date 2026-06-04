import fs from 'fs';
import path from 'path';

let targetFile = path.resolve('src/App.tsx');
if (!fs.existsSync(targetFile)) {
    targetFile = '/src/App.tsx';
}

let code = fs.readFileSync(targetFile, 'utf8');

const lines = code.split('\n');

for(let i=1445; i<1540; i++) {
   console.log(`${i}: ${lines[i]}`);
}
