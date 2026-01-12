import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Writable } from 'stream';

// Writable stream that rotates log file daily and writes JSON lines.
export class DailyLogger extends Writable {
  private currentDate: string;
  private stream: ReturnType<typeof createWriteStream>;
  private readonly logDir: string;

  constructor(logDir = 'logs') {
    super({ objectMode: true });
    this.logDir = logDir;
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
    this.currentDate = this.today();
    this.stream = this.openStream();
  }

  _write(chunk: any, _enc: BufferEncoding, cb: (err?: Error | null) => void) {
    try {
      this.rotateIfNeeded();
      const line = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
      this.stream.write(line + '\n');
      cb();
    } catch (err) {
      cb(err as Error);
    }
  }

  private rotateIfNeeded() {
    const now = this.today();
    if (now !== this.currentDate) {
      this.stream.end();
      this.currentDate = now;
      this.stream = this.openStream();
    }
  }

  _final(cb: (err?: Error | null) => void) {
    this.stream.end(cb);
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }

  private openStream() {
    const file = join(this.logDir, `${this.currentDate}.log`);
    return createWriteStream(file, { flags: 'a' });
  }
}
