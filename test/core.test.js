import test from 'node:test';
import assert from 'node:assert/strict';

import {
  levenshtein,
  levenshteinSimilarity,
  jaro,
  jaroWinkler,
} from '../src/index.js';

test('levenshtein: identical strings have distance 0', () => {
  assert.equal(levenshtein('kitten', 'kitten'), 0);
  assert.equal(levenshtein('', ''), 0);
});

test('levenshtein: classic kitten/sitting example', () => {
  assert.equal(levenshtein('kitten', 'sitting'), 3);
});

test('levenshtein: insertion and deletion', () => {
  assert.equal(levenshtein('', 'abc'), 3);
  assert.equal(levenshtein('abc', ''), 3);
  assert.equal(levenshtein('abc', 'abcd'), 1);
  assert.equal(levenshtein('abcd', 'abc'), 1);
});

test('levenshtein: substitution', () => {
  assert.equal(levenshtein('abc', 'abd'), 1);
  assert.equal(levenshtein('abc', 'xyz'), 3);
});

test('levenshtein: rejects non-string input', () => {
  assert.throws(() => levenshtein(1, 'a'), TypeError);
  assert.throws(() => levenshtein('a', null), TypeError);
});

test('levenshteinSimilarity: range and endpoints', () => {
  assert.equal(levenshteinSimilarity('', ''), 1);
  assert.equal(levenshteinSimilarity('abc', 'abc'), 1);
  assert.equal(levenshteinSimilarity('abc', 'xyz'), 0);
  const s = levenshteinSimilarity('kitten', 'sitting');
  assert.ok(s > 0 && s < 1);
  // 1 - 3/7 = 4/7
  assert.ok(Math.abs(s - 4 / 7) < 1e-12);
});

test('jaro: identical strings score 1', () => {
  assert.equal(jaro('abc', 'abc'), 1);
  assert.equal(jaro('', ''), 1);
});

test('jaro: empty vs non-empty scores 0', () => {
  assert.equal(jaro('', 'abc'), 0);
  assert.equal(jaro('abc', ''), 0);
});

test('jaro: known values', () => {
  // MARTHA / MARHTA is the canonical Jaro-Winkler example.
  // Jaro = 0.944444..., Jaro-Winkler = 0.961111...
  const j = jaro('MARTHA', 'MARHTA');
  assert.ok(Math.abs(j - 0.9444444444444444) < 1e-12);
});

test('jaro: no shared characters scores 0', () => {
  assert.equal(jaro('abc', 'xyz'), 0);
});

test('jaroWinkler: known value for MARTHA/MARHTA', () => {
  const jw = jaroWinkler('MARTHA', 'MARHTA');
  assert.ok(Math.abs(jw - 0.9611111111111111) < 1e-12);
});

test('jaroWinkler: prefix bonus raises score', () => {
  const j = jaro('prefixA', 'prefixB');
  const jw = jaroWinkler('prefixA', 'prefixB');
  assert.ok(jw > j);
  assert.ok(jw <= 1);
});

test('jaroWinkler: identical strings score 1', () => {
  assert.equal(jaroWinkler('abc', 'abc'), 1);
  assert.equal(jaroWinkler('', ''), 1);
});

test('jaroWinkler: empty vs non-empty scores 0', () => {
  assert.equal(jaroWinkler('', 'abc'), 0);
  assert.equal(jaroWinkler('abc', ''), 0);
});

test('jaroWinkler: rejects non-string input', () => {
  assert.throws(() => jaroWinkler(1, 'a'), TypeError);
  assert.throws(() => jaroWinkler('a', undefined), TypeError);
});
