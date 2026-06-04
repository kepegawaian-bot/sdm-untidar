import fs from 'fs';
import path from 'path';

let targetFile = path.resolve('src/App.tsx');
let code = fs.readFileSync(targetFile, 'utf8');
const lines = code.split('\n');

const idx = lines.findIndex((l, i) => i > 1520 && l.trim() === ')' && lines[i-1].includes('</button>'));
const close1 = lines[idx + 1];
const close2 = lines[idx + 2];
const paren = lines[idx + 3];
console.log('Lines around map end:');
console.log(lines.slice(idx - 2, idx + 6).join('\n'));

// Let's just fix it directly:
// We know lines[1525] = '                                                </button>'
// 1526 = '                                             )}'
// 1527 = '                                          </div>'
// 1528 = '                                      </div>'  (Oops, this is where we need to ensure two divs are closed)

let fixed = false;
for(let i=1520; i<1535; i++) {
  if (lines[i].includes(')}')) {
    if (lines[i+1].includes('</div>') && lines[i+2].includes(');')) {
      // Missing one div
      lines.splice(i+2, 0, '                                      </div>');
      fixed = true;
      break;
    }
  }
}

if(lines[1447].includes('<section') && lines[1535].includes('</section>')) {
   console.log('Section looks balanced up to here');
}

fs.writeFileSync(targetFile, lines.join('\n'));
console.log('Fixed file');
