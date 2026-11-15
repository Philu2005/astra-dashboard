#!/usr/bin/env node
/**
 * Minimaler CI-Check gegen riskante DOM-/Eval-APIs im App-Code.
 *
 * Verhindert (oder macht reviewpflichtig) die Verwendung folgender Muster in src/:
 * - dangerouslySetInnerHTML
 * - innerHTML / outerHTML / insertAdjacentHTML
 * - eval(
 * - new Function
 *
 * Keine Fremd-Abhängigkeiten, reine Node.js-Implementierung.
 */

import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

/** Dateien rekursiv sammeln */
function collectFiles(dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      // Nur unter src bleiben, node_modules etc. ist nicht unter src
      files.push(...collectFiles(full));
    } else if (st.isFile()) {
      const ext = extname(full);
      if (ext === '.ts' || ext === '.tsx') {
        files.push(full);
      }
    }
  }
  return files;
}

/** Gefährliche Muster (einfache Heuristiken) */
const PATTERNS = [
  { name: 'dangerouslySetInnerHTML', regex: /dangerouslySetInnerHTML\b/ },
  // Nur MemberAccess-ähnliche Funde in Betracht ziehen
  { name: 'innerHTML', regex: /\.\s*innerHTML\b/ },
  { name: 'outerHTML', regex: /\.\s*outerHTML\b/ },
  { name: 'insertAdjacentHTML', regex: /\.\s*insertAdjacentHTML\b/ },
  // eval( Funktionsaufruf
  { name: 'eval', regex: /\beval\s*\(/ },
  // new Function Konstruktor
  { name: 'new Function', regex: /\bnew\s+Function\b/ },
];

/** Bestimmte Pfade ignorieren (Test-Doubles dürfen Strings enthalten) */
function shouldIgnore(path) {
  // Security-Checks gelten auch in Tests; dennoch
  // können Snapshots/Markdown/Dokumentation ignoriert werden, liegen aber nicht unter src.
  return false;
}

const violations = [];

try {
  const files = collectFiles(SRC);
  for (const file of files) {
    if (shouldIgnore(file)) continue;
    const content = readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const p of PATTERNS) {
        if (p.regex.test(line)) {
          violations.push({ file, line: i + 1, rule: p.name, snippet: line.trim().slice(0, 200) });
        }
      }
    }
  }
} catch (err) {
  console.error('[xss-guard] Fehler beim Scannen:', err);
  process.exit(2);
}

if (violations.length > 0) {
  console.error('✖ XSS-Guard: Verbotene Pattern gefunden:');
  for (const v of violations) {
    console.error(`  - ${v.rule}: ${v.file}:${v.line}\n      ${v.snippet}`);
  }
  console.error('\nBitte entfernen oder Ausnahme manuell reviewen.');
  process.exit(1);
}

console.log('✔ XSS-Guard: Keine verbotenen Pattern in src gefunden.');
process.exit(0);
