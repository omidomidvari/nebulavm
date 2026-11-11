import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCorruptedFile } from '../corruptedfilechecker.js';
import { countAscii, limitOutput } from '../savemyeyes.js';
import { ErrorLimit } from '../errorlimit.js';
import { reportBeyondFatalError, resetBeyondFatalErrorForTests } from '../beyondfatalerror.js';
import { FatalErrorManagement } from '../fatalerrormanagemt.js';

test('bytecode checker accepts valid instructions and rejects malformed programs', () => {
  assert.equal(checkCorruptedFile(new Uint8Array([0x01, 42, 0x00])).valid, true);
  assert.equal(checkCorruptedFile(new Uint8Array([0x01])).valid, false);
  assert.equal(checkCorruptedFile(new Uint8Array([0xff])).valid, false);
  assert.equal(checkCorruptedFile(new Uint8Array([0x07, 0xff]), 128).valid, false);
});

test('output guard counts ASCII and truncates long output', () => {
  assert.equal(countAscii('aé'), 1);
  assert.ok(limitOutput('abcdefgh', 5, () => {}).length <= 5);
});

test('error limiter permits only the configured number of reports', () => {
  const limit = new ErrorLimit(2);
  assert.equal(limit.allow(), true);
  assert.equal(limit.allow(), true);
  assert.equal(limit.allow(), false);
  limit.reset();
  assert.equal(limit.allow(), true);
});

test('fatal manager records bounded, subscribable errors; fallback reports once', () => {
  const manager = new FatalErrorManagement(1);
  let observed = 0;
  const unsubscribe = manager.subscribe(() => { observed += 1; });
  manager.report(new Error('one'));
  manager.report(new Error('two'));
  assert.equal(observed, 2);
  assert.equal(manager.getHistory().length, 1);
  unsubscribe();

  resetBeyondFatalErrorForTests();
  assert.equal(reportBeyondFatalError(new Error('fallback')), true);
  assert.equal(reportBeyondFatalError(new Error('again')), false);
  resetBeyondFatalErrorForTests();
});
