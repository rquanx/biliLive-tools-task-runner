# biliLive-tools-helper

一个带鉴权的 Fastify `/test` 接口示例，支持按天滚动的 JSON 行日志，并提供生成鉴权密钥脚本与 CI/CD 工作流。

## 快速开始
- 安装依赖：`pnpm install`
- 开发运行：`pnpm dev`（读取 `.env` 中的端口与鉴权配置）
- 生成密钥：`pnpm gen:auth`（如果没有 `.env` 会创建并写入新的 `AUTH_SECRET`；已存在则仅替换密钥）
- 构建与启动：`pnpm build && pnpm start`（Vite 会产出未压缩的单文件 `dist/server.js`），再发送请求：
  - `curl -i -H "Authorization: <AUTH_SECRET>" http://localhost:15225/test`

## 环境变量
`.env` 示例：
```
PORT=15225
AUTH_HEADER=Authorization
AUTH_SECRET=dev-secret
```
部署前请通过 `pnpm gen:auth` 更新 `AUTH_SECRET`。

## 日志
- 路径：`logs/YYYY-MM-DD.log`
- 格式：按行 JSON，包含 `timestamp/method/url/headers/query/body/auth` 等字段
- 每日自动滚动；启动会确保日志目录存在。

## 测试
- 运行：`pnpm test`
- 覆盖：鉴权钩子返回 401/200、`/test` 回显，以及 `DailyLogger` 写入。

## 验证记录
- `pnpm test`：通过
- `pnpm build`：通过
- `pnpm start` + `curl -H "Authorization: dev-secret" http://localhost:15225/test`：返回 200，`logs/YYYY-MM-DD.log` 记录请求
