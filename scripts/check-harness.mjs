import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  '.cursor/rules/taalim.mdc',
  'PROJECT_MEMORY.md',
  'STATUS.md',
  'docs/GOALS.md',
  'docs/ROADMAP.md',
  'docs/RISKS.md',
  'docs/adr/README.md',
  'docs/REPOSITORY_GOVERNANCE.md',
  'docs/skills/project-context.md',
  'docs/skills/product-architecture.md',
  'docs/skills/security-privacy.md',
  'docs/skills/billing-ledger.md',
  'docs/skills/quality.md',
  'docs/skills/development-operations.md',
  '.github/ISSUE_TEMPLATE/implementation-task.md',
  '.github/pull_request_template.md',
  '.github/workflows/harness.yml',
  'scripts/check-harness.mjs',
];

const errors = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Missing required file: ${file}`);
}

const ignoredDirs = new Set(['.git', 'node_modules', '.next', 'dist', 'coverage']);
const textExt = new Set(['.md', '.mdc', '.mjs', '.js', '.ts', '.tsx', '.json', '.yml', '.yaml', '.txt']);
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (textExt.has(path.extname(entry.name)) || entry.name === 'AGENTS.md') files.push(full);
  }
}
walk(root);

const conflictPatterns = [/^<<<<<<< /m, /^=======\s*$/m, /^>>>>>>> /m];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (conflictPatterns.every((p) => p.test(text))) {
    errors.push(`Conflict markers found: ${path.relative(root, file)}`);
  }
}

for (const thin of ['CLAUDE.md', '.cursor/rules/taalim.mdc']) {
  const full = path.join(root, thin);
  if (!fs.existsSync(full)) continue;
  const text = fs.readFileSync(full, 'utf8');
  if (!text.includes('AGENTS.md')) errors.push(`${thin} must reference AGENTS.md`);
  if (text.split(/\r?\n/).length > 40) errors.push(`${thin} is not a thin entry point (>40 lines)`);
}

const mdLink = /\[[^\]]*\]\(([^)]+)\)/g;
for (const file of files.filter((f) => ['.md', '.mdc'].includes(path.extname(f)))) {
  const text = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = mdLink.exec(text))) {
    let target = match[1].trim().split(/\s+/)[0].replace(/^<|>$/g, '');
    if (!target || target.startsWith('#') || /^(https?:|mailto:)/.test(target)) continue;
    target = target.split('#')[0];
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
    if (!fs.existsSync(resolved)) errors.push(`Broken local link in ${path.relative(root, file)}: ${target}`);
  }
}

if (errors.length) {
  console.error('Harness validation failed:\n' + errors.map((e) => `- ${e}`).join('\n'));
  process.exit(1);
}

console.log(`Harness validation passed (${required.length} required files, ${files.length} text files checked).`);
