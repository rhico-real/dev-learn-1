import { execSync } from 'node:child_process';

const port = process.argv[2];

if (!port) {
  process.exit(0);
}

function run(command) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function getPids() {
  try {
    const output = run(`lsof -ti tcp:${port} -sTCP:LISTEN`);
    return [...new Set(output.split('\n').map((value) => value.trim()).filter(Boolean))];
  } catch {
    return [];
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const initialPids = getPids();

if (initialPids.length === 0) {
  process.exit(0);
}

console.log(`Clearing port ${port}: ${initialPids.join(', ')}`);

for (const pid of initialPids) {
  try {
    execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
  } catch {
    // The verification loop below decides whether cleanup actually succeeded.
  }
}

for (let attempt = 0; attempt < 10; attempt += 1) {
  const remaining = getPids();

  if (remaining.length === 0) {
    process.exit(0);
  }

  await wait(150);
}

const remaining = getPids();

if (remaining.length > 0) {
  console.error(`Port ${port} is still occupied by: ${remaining.join(', ')}`);
  process.exit(1);
}
