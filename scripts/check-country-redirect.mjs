import assert from 'node:assert/strict';
import fs from 'node:fs';

const target = '/country/united-kingdom';
const rules = fs.readFileSync('dist/_redirects', 'utf8').trim().split('\n')
  .filter((line) => line && !line.startsWith('#')).map((line) => line.trim().split(/\s+/));
for (const source of ['/country/london', '/country/london/']) {
  assert.deepEqual(rules.find(([path]) => path === source), [source, target, '301']);
}
const manifest = JSON.parse(fs.readFileSync('dist/search/manifest.json', 'utf8'));
const ukNotes = manifest.filter((note) => note.country === 'United Kingdom');
assert.ok(ukNotes.length > 0, 'redirect destination must have published entries');
assert.ok(!manifest.some((note) => note.country === 'London'), 'London is an area, not a country');
const page = fs.readFileSync(`dist${target}/index.html`, 'utf8');
for (const note of ukNotes) {
  assert.ok(page.includes(`/restaurant/${note.slug}`), `missing UK entry: ${note.slug}`);
}
const homepage = fs.readFileSync('dist/index.html', 'utf8');
assert.ok(homepage.includes(target), 'homepage must link to the UK country page');
assert.ok(!homepage.includes('/country/london'), 'homepage must not link to the retired country');
console.log('check-country-redirect: both London URLs preserve access to all UK entries');
