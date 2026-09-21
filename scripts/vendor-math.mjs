import { mkdir, copyFile, cp } from 'node:fs/promises';
const target = new URL('../vendor/katex/', import.meta.url);
const source = new URL('../node_modules/katex/', import.meta.url);
await mkdir(target, { recursive: true });
for (const name of ['katex.mjs', 'katex.min.css']) await copyFile(new URL('dist/' + name, source), new URL(name, target));
await copyFile(new URL('LICENSE', source), new URL('LICENSE', target));
await cp(new URL('dist/fonts/', source), new URL('fonts/', target), { recursive: true });
