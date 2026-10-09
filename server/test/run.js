// Cross-platform test runner (shell globs are not expanded on Windows).
// Usage: node test/run.js [unit|integration]   (no argument runs both)
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const suites = process.argv[2] ? [process.argv[2]] : ['unit', 'integration'];
const files = suites.flatMap((s) => readdirSync(join(root, s)).filter((f) => f.endsWith('.test.js')).map((f) => join(root, s, f)));
if (!files.length) { console.error('No test files found'); process.exit(1); }
const res = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } });
process.exit(res.status ?? 1);
