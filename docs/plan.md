[biliLive-tools-task-runner /test 接口] 实施计划
目标： 交付一个带鉴权的 Fastify `/test` 接口，记录每次请求到按天分割的 JSON 行日志，并提供生成鉴权密钥的脚本与基础部署流水线。

架构： Node.js 24 + Fastify 提供 HTTP 服务；自定义 pino stream 将请求记录写入 `logs/YYYY-MM-DD.log`，日期切换时滚动文件；配置通过 `.env` 读取，鉴权使用固定 Header 匹配；Vitest 覆盖鉴权、路由回显、日志落盘。

技术栈： pnpm、TypeScript、Fastify、pino、dotenv、tsx、Vitest、GitHub Actions。

1) 初始化项目骨架（2-5 分钟）
- 在仓库根执行 `pnpm init -y`（生成 `package.json`）。
- 添加 `.gitignore` 包含 `node_modules/`, `dist/`, `logs/`, `.env`（若文件不存在则创建）。
- 创建目录结构：`src/`, `src/routes/`, `src/logger/`, `scripts/`, `logs/`（空目录用于日志，确保创建）。

2) 安装依赖（2-5 分钟）
- 执行 `pnpm add fastify pino dotenv`（应成功且无错误）。
- 执行 `pnpm add -D typescript tsx @types/node vitest supertest`（用于构建与测试）。
- 运行 `pnpm tsc --init --rootDir src --outDir dist --esModuleInterop --module commonjs --target ES2020 --moduleResolution node --resolveJsonModule --strict`（生成 `tsconfig.json`，确认无报错）。

3) 配置 NPM 脚本（2-5 分钟）
- 在 `package.json` 的 `scripts` 增加：
  - `"dev": "tsx src/server.ts"`
  - `"build": "tsc"`
  - `"start": "node dist/server.js"`
  - `"test": "vitest run"`
  - `"gen:auth": "tsx scripts/gen-auth.ts"`
确保无重复键，保存后运行 `pnpm test -- --help` 验证脚本可执行（应显示 Vitest 帮助且退出码 0）。

4) 准备环境变量文件（2-5 分钟）
- 在仓库根创建 `.env` 初始内容：
  ```
  PORT=15225
  AUTH_HEADER=Authorization
  AUTH_SECRET=dev-secret
  ```
- 说明：真实部署前通过 `pnpm gen:auth` 更新 `AUTH_SECRET`。

5) 实现日志写入模块（2-5 分钟）
- 在 `src/logger/daily-logger.ts` 编写 `DailyLogger` 类，核心实现：
  ```ts
  import { createWriteStream, existsSync, mkdirSync } from 'fs';
  import { join } from 'path';
  import { Writable } from 'stream';

  export class DailyLogger extends Writable {
    private currentDate: string;
    private stream: ReturnType<typeof createWriteStream>;
    private readonly logDir: string;

    constructor(logDir = 'logs') {
      super({ objectMode: true });
      this.logDir = logDir;
      if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
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

    private today() {
      return new Date().toISOString().slice(0, 10);
    }

    private openStream() {
      const file = join(this.logDir, `${this.currentDate}.log`);
      return createWriteStream(file, { flags: 'a' });
    }
  }
  ```
- 目标：提供 pino 兼容的 stream，确保日期切换时新建文件。

6) 配置 pino 实例（2-5 分钟）
- 在 `src/logger/index.ts`（新建）定义：
  ```ts
  import pino from 'pino';
  import { DailyLogger } from './daily-logger';

  export const logger = pino({}, new DailyLogger());
  ```
- 作用：导出全局 logger 供路由与鉴权使用。

7) 编写 `/test` 路由（2-5 分钟）
- 在 `src/routes/test.ts` 实现 Fastify 插件：
  ```ts
  import { FastifyInstance } from 'fastify';
  import { logger } from '../logger';

  export async function testRoute(app: FastifyInstance) {
    app.all('/test', async (request, reply) => {
      const payload = {
        timestamp: new Date().toISOString(),
        method: request.method,
        url: request.url,
        headers: request.headers,
        query: request.query,
        body: request.body
      };
      logger.info(payload);
      return reply.code(200).send({ ok: true, method: request.method, url: request.url });
    });
  }
  ```
- 要求：支持 GET/POST/PUT 等任意方法，调用 logger 记录请求。

8) 实现服务入口与鉴权（2-5 分钟）
- 在 `src/server.ts` 编写：
  ```ts
  import Fastify from 'fastify';
  import dotenv from 'dotenv';
  import { logger } from './logger';
  import { testRoute } from './routes/test';

  dotenv.config();

  const app = Fastify({ logger: false });
  const port = Number(process.env.PORT || 15225);
  const authHeader = process.env.AUTH_HEADER || 'Authorization';
  const authSecret = process.env.AUTH_SECRET || '';

  app.addHook('onRequest', async (request, reply) => {
    const headerValue = request.headers[authHeader.toLowerCase()] || request.headers[authHeader];
    const authorized = typeof headerValue === 'string' && headerValue === authSecret;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      headers: request.headers,
      query: request.query,
      body: request.body,
      auth: authorized ? 'ok' : 'fail'
    };
    logger.info(logEntry);
    if (!authorized) {
      reply.code(401).send({ ok: false, error: 'Unauthorized' });
    }
  });

  app.register(testRoute);

  app.listen({ port }).then(() => {
    console.log(`Server listening on ${port}`);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
  ```
- 行为：请求到达先记录并校验鉴权失败直接返回 401；成功则继续到路由。

9) 生成鉴权脚本（2-5 分钟）
- 在 `scripts/gen-auth.ts` 实现：
  ```ts
  import { readFileSync, writeFileSync, existsSync } from 'fs';

  const envPath = '.env';
  const secret = [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, '0')).join('');
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
  const updated = env.filter((line) => !line.startsWith('AUTH_SECRET=')).concat([`AUTH_SECRET=${secret}`]).filter(Boolean).join('\n') + '\n';
  writeFileSync(envPath, updated);
  console.log('Updated AUTH_SECRET in .env');
  ```
- 预期：运行 `pnpm gen:auth` 后 `.env` 中 `AUTH_SECRET` 被替换，命令输出 “Updated AUTH_SECRET in .env”。

10) 编写测试用例（2-5 分钟）
- 在 `src/server.test.ts` 使用 Vitest + supertest：
  ```ts
  import { describe, it, expect, beforeAll, afterAll } from 'vitest';
  import supertest from 'supertest';
  import Fastify from 'fastify';
  import { testRoute } from './routes/test';

  const AUTH_SECRET = 'test-secret';

  const buildApp = async () => {
    const app = Fastify();
    const authHeader = 'Authorization';
    app.addHook('onRequest', async (request, reply) => {
      const authorized = request.headers[authHeader.toLowerCase()] === AUTH_SECRET;
      if (!authorized) reply.code(401).send({ ok: false, error: 'Unauthorized' });
    });
    await app.register(testRoute);
    await app.ready();
    return app;
  };

  describe('/test route', () => {
    let app: Awaited<ReturnType<typeof buildApp>>;
    let request: supertest.SuperTest<supertest.Test>;

    beforeAll(async () => {
      app = await buildApp();
      request = supertest(app.server);
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 401 without auth', async () => {
      const res = await request.get('/test');
      expect(res.status).toBe(401);
    });

    it('returns ok with auth and echoes', async () => {
      const res = await request
        .post('/test?foo=bar')
        .set('Authorization', AUTH_SECRET)
        .send({ a: 1 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true, method: 'POST', url: '/test?foo=bar' });
    });
  });
  ```
- 目标：验证鉴权与回显；日志落盘在单测中不写磁盘，专注路由逻辑。

11) 添加日志落盘测试（2-5 分钟）
- 在 `src/logger/daily-logger.test.ts` 使用 Vitest：
  ```ts
  import { describe, it, expect, beforeEach, afterEach } from 'vitest';
  import { mkdtempSync, readFileSync, rmSync } from 'fs';
  import { tmpdir } from 'os';
  import { join } from 'path';
  import { DailyLogger } from './logger/daily-logger';

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
      logger.write({ a: 1 });
      logger.end();
      const today = new Date().toISOString().slice(0, 10);
      const content = readFileSync(join(dir, `${today}.log`), 'utf8').trim();
      expect(content).toBe('{"a":1}');
    });
  });
  ```
- 预期：确保自定义 stream 按日期写入 JSON 行。

12) 运行测试（2-5 分钟）
- 执行 `pnpm test`，预期输出包含 `✔` 通过的测试数且退出码 0。

13) 构建与启动自检（2-5 分钟）
- 执行 `pnpm build`（生成 `dist/`，无 TypeScript 错误）。
- 执行 `pnpm start`，发送请求验证：
  - `curl -i -H "Authorization: dev-secret" http://localhost:15225/test` 预期 `200` 且 JSON `{ "ok": true, "method": "GET", "url": "/test" }`。
  - 检查 `logs/YYYY-MM-DD.log` 存在，包含请求 JSON 行。
- 停止进程。

14) GitHub Actions 工作流（2-5 分钟）
- 新建 `.github/workflows/ci.yml`：
  ```yaml
  name: ci
  on:
    push:
    pull_request:
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v3
          with:
            version: 9
        - uses: actions/setup-node@v4
          with:
            node-version: 24
            cache: pnpm
        - run: pnpm install --frozen-lockfile
        - run: pnpm test
        - run: pnpm build
  ```
- 预期：推送后 workflow 依次安装依赖、跑测试、构建。

15) 部署工作流骨架（2-5 分钟）
- 在 `.github/workflows/deploy.yml` 创建示例（保持占位，后续补全服务器细节）：
  ```yaml
  name: deploy
  on:
    workflow_dispatch:
  jobs:
    deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v3
          with:
            version: 9
        - uses: actions/setup-node@v4
          with:
            node-version: 24
            cache: pnpm
        - run: pnpm install --frozen-lockfile
        - run: pnpm build
        - run: tar czf artifact.tar.gz dist package.json pnpm-lock.yaml .env
        - name: Upload or scp artifact
          run: echo "TODO: add scp/ssh commands for target server"
  ```
- 目的：准备 CI/CD 结构，后续补全主机信息。

16) 文档与验证记录（2-5 分钟）
- 在 `README.md` 添加运行与测试指引（命令、环境变量说明、日志位置）。
- 记录本地验证：列出运行的命令及状态（pnpm test/build/start），确认日志文件生成。

17) 清理与提交（2-5 分钟）
- 运行 `pnpm lint`（如未配置则跳过，说明未设 lint）。
- `git status` 检查变更；如需要提交，信息类似 `feat: add fastify test endpoint with auth`。
