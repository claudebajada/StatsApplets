// Lightweight syntax and HTML association checks; no build step or lint framework.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
for (const dir of ['javascript', 'scripts', 'tests', 'tests/browser']) {
  for (const file of fs.readdirSync(dir).filter(p=>p.endsWith('.js'))) cp.execFileSync(process.execPath,['--check',path.join(dir,file)]);
}
cp.execFileSync(process.execPath,['--check','playwright.config.js']);
for (const file of ['index.html', ...fs.readdirSync('html').map(f=>'html/'+f)]) {
  const html = fs.readFileSync(file,'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,`${file}: duplicate IDs`);
  for (const [,id] of html.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g)) {
    assert.ok(new RegExp(`<(input|select|textarea)\\b[^>]*\\bid="${id}"`).test(html),`${file}: label ${id} must target a control`);
  }
  for (const [,href] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (!/^(https?:|#)/.test(href)) assert.ok(fs.existsSync(path.resolve(path.dirname(file),href)),`${file}: missing ${href}`);
  }
  assert.match(html,/<!DOCTYPE html>/i);assert.match(html,/<html lang="en">/);
}
console.log('JavaScript syntax, local resources, IDs and label associations passed.');
