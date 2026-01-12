import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DailyLogger } from './daily-logger';

describe('DailyLogger', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'logs-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes JSON lines to today file', async () => {
    const logger = new DailyLogger(dir);
    await new Promise<void>((resolve, reject) =>
      logger.write({ a: 1 }, (err) => (err ? reject(err) : resolve()))
    );
    await new Promise<void>((resolve, reject) =>
      logger.end((err) => (err ? reject(err) : resolve()))
    );
    const today = new Date().toISOString().slice(0, 10);
    const content = readFileSync(join(dir, `${today}.log`), 'utf8').trim();
    expect(content).toBe('{"a":1}');
  });
});
