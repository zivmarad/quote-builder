import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const content = fs.readFileSync(path.join(__dirname, '../app/service/services.ts'), 'utf8');

const service = {};
const question = {};

// Match service block: id: 'service-id',\n        name: '...'
const serviceRegex = /id: '([a-z0-9-]+)',\s*\n\s*name: '((?:[^'\\]|\\.)*)'/g;
let m;
while ((m = serviceRegex.exec(content)) !== null) {
  const id = m[1];
  const name = m[2].replace(/\\'/g, "'");
  if (id.length > 2 && id.includes('-')) service[id] = name;
}

// Match question: { id: 'q1', text: '...', impact: ...
const questionBlockRegex = /id: '([a-z0-9-]+)',\s*\n\s*name: '(?:[^'\\]|\\.)*',[\s\S]*?questions: \[\s*([\s\S]*?)\s*\],/g;
let block;
while ((block = questionBlockRegex.exec(content)) !== null) {
  const serviceId = block[1];
  const questionsStr = block[2];
  const qRegex = /\{\s*id:\s*'([^']+)',\s*text:\s*'((?:[^'\\]|\\.)*)'/g;
  let qm;
  question[serviceId] = {};
  while ((qm = qRegex.exec(questionsStr)) !== null) {
    question[serviceId][qm[1]] = qm[2].replace(/\\'/g, "'");
  }
}

const out = { service, question };
fs.writeFileSync(path.join(__dirname, '../app/locales/extracted-he.json'), JSON.stringify(out, null, 2), 'utf8');
console.log('Extracted:', Object.keys(service).length, 'services', Object.keys(question).length, 'service question sets');

// Merge into he.json
const localesDir = path.join(__dirname, '../app/locales');
const hePath = path.join(localesDir, 'he.json');
const he = JSON.parse(fs.readFileSync(hePath, 'utf8'));
he.service = service;
he.question = question;
fs.writeFileSync(hePath, JSON.stringify(he, null, 2), 'utf8');
console.log('Merged service + question into he.json');

// Add same keys to en, ru, ar (Hebrew as placeholder until translated)
for (const loc of ['en', 'ru', 'ar']) {
  const p = path.join(localesDir, `${loc}.json`);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  data.service = service;
  data.question = question;
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  console.log('Added service + question to', loc + '.json');
}
