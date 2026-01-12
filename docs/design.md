# 方案设计文档（biliLive-tools-task-runner）

## 目标与范围
- 目标：实现一个 Node.js API 服务，优先提供 `/test` 接口用于观察外部请求内容；支持鉴权与按天分割的请求日志。
- 范围：本阶段仅实现 `/test` 接口（打印 + 保存日志）。后续“动作”在确认请求类型后再扩展。

## 技术选型
- 运行时：Node.js 24
- Web 框架：Fastify
- 日志：pino（按天分割写入 `logs/`）
- 包管理：pnpm

## 环境变量（.env）
- `PORT`：服务监听端口，默认 `15225`
- `AUTH_HEADER`：鉴权用的 Header 名称（固定为 `Authorization`）
- `AUTH_SECRET`：鉴权密钥（随机生成）

说明：
- `.env` 中除 `AUTH_SECRET` 外的变量需保留；脚本仅更新鉴权值。

## 接口设计
### 1) `/test`
**方法**：GET / POST / PUT  
**鉴权**：请求头 `Authorization: <AUTH_SECRET>`  
**行为**：
- 返回 `200` JSON，包含 `ok: true` 和简要回显（method、url）。
- 将请求信息记录到日志文件。

**记录字段（日志）**：
- `timestamp`
- `method`
- `url`
- `headers`
- `query`
- `body`

## 鉴权设计
- 采用固定 Header 鉴权：`Authorization` = `AUTH_SECRET`
- 未提供或不匹配返回 `401`
- 认证失败也记录到日志（用于排查）

## 日志设计
- 输出目录：`logs/`
- 按天分割：文件名 `logs/YYYY-MM-DD.log`
- 日志内容为 JSON 行，便于检索
- 不做脱敏、不记录耗时

实现方式（设计）：
- 使用 pino 自定义 stream：
  - 启动时创建当天的 write stream
  - 请求写入前检查日期是否变化，变化则切换文件

## 项目结构（建议）
```
.
├── src/
│   ├── server.ts
│   ├── routes/
│   │   └── test.ts
│   └── logger/
│       └── daily-logger.ts
├── logs/
├── .env
├── package.json
```

## 脚本设计（pnpm）
### 常规脚本
- `dev`：本地开发启动（ts-node 或 tsx）
- `build`：编译为 JS
- `start`：运行编译产物

### 生成鉴权密钥
新增脚本 `gen:auth`：
- 生成随机 `AUTH_SECRET`
- 读取 `.env`，仅更新该字段，保留其余变量
- `.env` 不存在则创建并写入默认变量

## 构建与部署（GitHub Actions）
### 构建产物
- 产出 JS（`dist/`）
- 产出 `package.json` / `pnpm-lock.yaml` / `.env`（如需）

### 部署目标
阿里云 Linux 服务器（自有）

### 部署流程（设计）
1. GitHub Actions 执行 `pnpm install` + `pnpm build`
2. 打包 `dist/` 和必要运行文件（如 `package.json`、`pnpm-lock.yaml`、`.env`）
3. 通过 `scp` 传输到服务器
4. SSH 远程执行：
   - 安装依赖（如需要）
   - 运行 `node dist/server.js`

## 非功能性要求
- 可观测性：日志可直接用于排查请求问题
- 可靠性：日志文件滚动不丢失（日期切换时安全替换）

## 待办清单
- 确认是否需要响应体中回显更多字段
- 若后续需要扩展“动作”，再新增路由与执行器模块
