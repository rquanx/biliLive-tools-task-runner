# biliLive-tools-task-runner

基于 Fastify 的小型服务，提供 `/test` 回显与自动清理录制文件的 `/del` 流程，包含固定 Header 鉴权、按天滚动的 JSON 行日志，以及 server 酱通知能力。

## 快速开始
- 安装依赖：`pnpm install`
- 生成/刷新鉴权密钥：`pnpm gen:auth`（创建 `.env` 并写入随机 `AUTH_SECRET`，保留其他变量）
- 本地运行：`pnpm dev`（读取 `.env`，默认监听 `0.0.0.0:15225`）
- 构建与启动：`pnpm build && pnpm start`（tsup 打包为单文件 `dist/server.js`）
- 探活示例：
  - `/test`：`curl -i -H "Authorization: <AUTH_SECRET>" http://localhost:15225/test`
  - `/del/continue`：`curl -i http://localhost:15225/del/continue`

## 环境变量
`.env` 示例：
```
PORT=15225              # 监听端口
HOST=0.0.0.0            # 可选，默认 0.0.0.0
AUTH_HEADER=Authorization
AUTH_SECRET=dev-secret  # 运行 gen:auth 后会被随机值替换
SERVER_CHAN_SEND_KEY=<SERVER_CHAN_SEND_KEY> # server 酱 sendKey，缺省则仅记录 warn
```

## 接口说明
- `/test`（ALL，需鉴权）
  - 请求头：`<AUTH_HEADER>: <AUTH_SECRET>`
  - 响应：`{ ok: true, method, url }`
  - 作用：快速回显请求并写日志。
- `/del`（POST，需鉴权）
  - Body：`{ "title": "<state>:<taskType>: <fileName>", "dir": "<root dir>" }`
  - canDelete 内存开关默认开启；为 false 时直接返回 `{ ok: true, skipped: 'delete-paused' }` 并通知“删除任务暂停中”。
  - 处理流程：
    - `title` 解析失败则跳过（`skipped: 'bad-title'`）。
    - `state !== '成功'`：暂停删除、通知“录制任务失败”，返回 `{ ok: true, paused: true }`。
    - 仅处理 `taskType === '同步任务'` 且扩展名为 `.mp4` 的文件，否则跳过。
    - 递归扫描 `dir` 查找同名文件；异常返回 500（`error: 'scan-failed'`），未找到返回 `reason: 'not-found'`。
    - 找到后等待 2 分钟，若文件被占用（EBUSY/EACCES/EPERM）则 `reason: 'locked'`，否则删除并返回 `{ ok: true, deleted: true }`。
- `/del/continue`（ALL，免鉴权）
  - 将 canDelete 置为 true，记录日志；若之前暂停过会通知“删除功能启用”。

## 日志
- 路径：`logs/YYYY-MM-DD.log`
- 形式：按天滚动的 JSON 行日志（pino），包含 `timestamp/method/url/headers/query/body/auth/step` 等字段
- 启动时保证 `logs/` 存在；跨天自动切换新文件。

## 通知
- 配置 `SERVER_CHAN_SEND_KEY` 后，会向 server 酱发送标题通知；同一标题 1 小时内只发一次。
- 未配置 sendKey 时跳过发送并记录 warn。

## 测试
- 运行：`pnpm test`（Vitest，覆盖 `/test` 鉴权与 `/del` 的暂停/恢复、目录扫描、文件锁定、删除等分支）
- 调试脚本：`pnpm t` 运行 `test/mock.test.ts`

## 部署
- GitHub Actions：`.github/workflows/deploy.yml` 在 `master` 推送或手动触发时执行 `pnpm build`，通过 scp 下发 `dist/` 与 `.env` 到远端 `${TARGET_DIR}`，再用 pm2 运行 `dist/server.js`。
- 必要配置：`SERVER_CHAN_SEND_KEY`（secret，用于替换 `.env` 占位符）、SSH 凭据（`SSH_HOST`/`SSH_USERNAME`/`SSH_PRIVATE_KEY`）、仓库变量 `TARGET_DIR`（部署路径）。
