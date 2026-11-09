#!/usr/bin/env node
import { readFileSync } from 'node:fs';

export const KNOWN_CODES = Object.freeze({
  'NVM-0000': { title: 'Unknown NebulaVM error', advice: 'Inspect the message and stack trace for context.' },
  'NVM-1001': { title: 'Invalid argument', advice: 'Check the value and type passed to the reported API.' },
  'NVM-1002': { title: 'Program too large', advice: 'Reduce the program size or increase VM memory.' },
  'NVM-2001': { title: 'Invalid opcode', advice: 'Check the assembled bytecode and opcode definitions.' },
  'NVM-2002': { title: 'Program counter out of bounds', advice: 'Check instruction widths and control flow.' },
  'NVM-2003': { title: 'Operand fetch out of bounds', advice: 'The instruction is missing an operand or ends at the memory boundary.' },
  'NVM-2004': { title: 'Jump target out of bounds', advice: 'Check the JMP/JZ target and VM memory size.' },
  'NVM-2005': { title: 'Memory read out of bounds', advice: 'Check the address used by the memory-load instruction.' },
  'NVM-2006': { title: 'Memory write out of bounds', advice: 'Check the address used by the memory-store instruction.' },
  'NVM-3001': { title: 'Interrupt handler failed', advice: 'Inspect the interrupt callback and its input state.' },
  'NVM-4001': { title: 'Storage failure', advice: 'Check storage availability, quota, and stored data.' },
});

const RULES = [
  { test: /EINTEGRITY|integrity checksum failed/i, title: 'Package integrity mismatch', advice: 'Check the lockfile integrity against the package registry; remove stale npm cache only if the lockfile value is verified.' },
  { test: /npm ci|npm install|ERESOLVE/i, title: 'Dependency installation problem', advice: 'Review the first npm error above this line and verify package.json/package-lock.json are in sync.' },
  { test: /TS\d{4}:/i, title: 'TypeScript compilation error', advice: 'Use the TS code and file/line shown in the log to correct the type or import error.' },
  { test: /MODULE_NOT_FOUND|Cannot find module/i, title: 'Missing module or incorrect import', advice: 'Verify the file exists, filename casing matches, and the import path is correct.' },
  { test: /UnhandledPromiseRejection|unhandledrejection/i, title: 'Unhandled promise rejection', advice: 'Handle the rejected promise or route it through the application error handler.' },
  { test: /\b(out of bounds|out-of-bounds)\b/i, title: 'Bounds error', advice: 'Check the address/program counter and validate it before accessing memory.' },
];

export function interpretLog(input) {
  const lines = String(input).split(/\r?\n/);
  const findings = [];
  const seen = new Set();
  const add = (finding) => {
    const key = `${finding.code ?? ''}:${finding.title}:${finding.line}`;
    if (!seen.has(key)) { seen.add(key); findings.push(finding); }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const codeMatch = line.match(/\bNVM-\d{4}\b/);
    if (codeMatch) {
      const code = codeMatch[0];
      const known = KNOWN_CODES[code] ?? { title: 'Unrecognized NebulaVM error code', advice: 'Check the project error-code definitions for this code.' };
      add({ code, title: known.title, advice: known.advice, line: index + 1, excerpt: line.trim() });
    }

    for (const rule of RULES) {
      if (rule.test.test(line)) add({ title: rule.title, advice: rule.advice, line: index + 1, excerpt: line.trim() });
    }

    if (/\b(error|fatal|failed|failure)\b/i.test(line) && !codeMatch) {
      add({ title: 'Error message', advice: 'Review this message together with nearby lines and the stack trace.', line: index + 1, excerpt: line.trim() });
    }
  }

  return { lineCount: lines.length, findings };
}

function printHelp() {
  console.log('NebulaVM log interpreter');
  console.log('Usage: npm run logs -- <logfile>');
  console.log('       node scripts/log-interpreter.js <logfile>');
  console.log('Reads a text log and explains recognized NVM error codes, npm install errors, and TypeScript errors.');
}

function main(args) {
  const file = args.find((arg) => arg !== '--');
  if (!file || file === '--help' || file === '-h') { printHelp(); return file ? 0 : 2; }
  let input;
  try { input = readFileSync(file, 'utf8'); }
  catch (error) { console.error(`Could not read log file "${file}": ${error.message}`); return 1; }

  const report = interpretLog(input);
  console.log(`Log lines: ${report.lineCount}`);
  if (report.findings.length === 0) {
    console.log('No recognized errors found. If the problem persists, include the full log and command that produced it.');
    return 0;
  }
  console.log(`Findings: ${report.findings.length}`);
  for (const finding of report.findings) {
    console.log(`\nLine ${finding.line}${finding.code ? ` — ${finding.code}` : ''}: ${finding.title}`);
    console.log(`  ${finding.advice}`);
    if (finding.excerpt) console.log(`  Log: ${finding.excerpt}`);
  }
  return 0;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.exitCode = main(process.argv.slice(2));
}
