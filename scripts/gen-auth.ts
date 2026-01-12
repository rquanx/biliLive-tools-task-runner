import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomBytes } from 'crypto';

const envPath = '.env';
const secret = randomBytes(24).toString('hex');
const defaults = `PORT=15225
AUTH_HEADER=Authorization
AUTH_SECRET=${secret}
`;

if (!existsSync(envPath)) {
  writeFileSync(envPath, defaults);
  console.log(`Created ${envPath} with new AUTH_SECRET`);
  process.exit(0);
}

const env = readFileSync(envPath, 'utf8').split('\n');
const updated = env
  .filter((line) => !line.startsWith('AUTH_SECRET='))
  .concat([`AUTH_SECRET=${secret}`])
  .filter(Boolean)
  .join('\n') + '\n';

writeFileSync(envPath, updated);
console.log('Updated AUTH_SECRET in .env');
