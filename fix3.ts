import fs from 'fs';
import path from 'path';

let targetFile = path.resolve('src/App.tsx');
let code = fs.readFileSync(targetFile, 'utf8');
const lines = code.split('\n');

lines.splice(1478, 0, '                                             </div>', '                                          </div>');

fs.writeFileSync(targetFile, lines.join('\n'));
console.log('Fixed file');
