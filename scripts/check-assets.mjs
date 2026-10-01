import {readFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve('dist'),html=await readFile(resolve(root,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="(\.\/[^"#?]+)"/g))await access(resolve(root,match[1]));
for(const file of ['app.js','storage.js']){const text=await readFile(resolve(root,file),'utf8');for(const match of text.matchAll(/(?:from\s*|fetch\()'(.\/[^']+)'/g))await access(resolve(root,match[1]));}
console.log('All local HTML/module/data references exist.');
