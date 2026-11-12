// Gera duas versões da página em dist/:
//  - mapa-lilly.html          bibliotecas pelo CDN; é o arquivo publicado como Artifact no claude.ai
//  - mapa-lilly-offline.html  tudo embutido; abre com dois cliques em qualquer navegador. A leitura com Claude
//                             usa a chave da API da própria pessoa (o Artifact usa a conta do claude.ai).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
const read = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
const strip = (f) => read(f).replace(/^import .*$/gm, '').replace(/^export /gm, '');

const modules = ['engine', 'scoring', 'interp', 'extras', 'glyphs', 'features', 'sky'];
const code = modules.map((m) => strip(`./src/${m}.js`)).join('\n');
const world = JSON.stringify(JSON.parse(read('./vendor/countries-50m.json')));

// SDK oficial da Anthropic para a leitura com a chave da própria pessoa, empacotado num só script.
const claudeKey = buildSync({ entryPoints: [fileURLToPath(new URL('./src/claude-key.js', import.meta.url))], bundle: true, minify: true, format: 'iife', platform: 'browser', target: 'es2020', write: false, legalComments: 'none' }).outputFiles[0].text;

const online = read('./src/page.src.html')
  .replace('/*ENGINE*/', () => code)
  .replace('/*TZ*/', () => read('./vendor/tz.js'))
  .replace('/*WORLD*/null', () => world);

// Bibliotecas que no Artifact vêm do CDN, com a mesma versão fixada no package.json.
const LIBS = [
  ['https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js', 'astronomy-engine/astronomy.browser.min.js'],
  ['https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js', 'd3/dist/d3.min.js'],
  ['https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js', 'topojson-client/dist/topojson-client.min.js'],
];
// Texto de biblioteca seguro dentro de <script>: nada pode fechar a tag nem abrir comentário HTML.
const safe = (js) => js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
const lib = (p) => readFileSync(new URL(`./node_modules/${p}`, import.meta.url), 'utf8');

let offline = online.replace('/*CLAUDEKEY*/', () => safe(claudeKey));
const artifact = online.replace('/*CLAUDEKEY*/', '');
for (const [url, path] of LIBS) {
  const tag = `<script src="${url}"></script>`;
  if (!offline.includes(tag)) throw new Error(`não achei ${tag}`);
  offline = offline.replace(tag, () => `<script>${safe(lib(path))}\n</script>`);
}
// jsPDF continua sob demanda: fica guardado como texto e vira um blob: só quando alguém pede o PDF.
const jspdf = `<script type="text/plain" id="jspdf-src">${safe(lib('jspdf/dist/jspdf.umd.min.js'))}</script>
<script>window.JSPDF_LOCAL = URL.createObjectURL(new Blob([document.getElementById('jspdf-src').textContent], { type: 'text/javascript' }));</script>`;
const note = offline.match(/<!-- jsPDF é carregado[^\n]*-->/);
if (!note) throw new Error('não achei o comentário do jsPDF');
offline = offline.replace(note[0], () => jspdf);

// O Artifact recebe o esqueleto do claude.ai; a versão solta precisa do seu próprio.
const head = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
`;
offline = head + offline + '\n</body>\n</html>\n';

mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
writeFileSync(new URL('./dist/mapa-lilly.html', import.meta.url), artifact);
writeFileSync(new URL('./dist/mapa-lilly-offline.html', import.meta.url), offline);
console.log(`dist/mapa-lilly.html ${(artifact.length / 1024).toFixed(0)} KB`);
console.log(`dist/mapa-lilly-offline.html ${(offline.length / 1024).toFixed(0)} KB`);
