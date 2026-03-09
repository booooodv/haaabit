# Self-hosting / 自托管

This repository ships an official self-hosted path based on Docker Compose with one public entrypoint.

这个仓库提供一条官方自托管路径：基于 Docker Compose，并通过单一公网入口对外提供服务。

## English

### Topology

- `proxy` is the only published service.
- `web` serves the Next.js app.
- `api` serves auth, habit APIs, today APIs, stats, and OpenAPI.
- `migrate` is a one-off operator command used for first install and upgrades.

By default the stack stores data in a named Docker volume and serves the app at `http://localhost:8080`.

### Prerequisites

- Docker Desktop or Docker Engine with Compose v2
- A shell that can run the commands below

### Configuration

1. Copy the example file:

```bash
cp .env.example .env
```

2. Generate a secret:

```bash
openssl rand -hex 32
```

3. Edit `.env` and set at least:

- `APP_BASE_URL`
- `BETTER_AUTH_SECRET`

Default first-install values:

- `APP_BASE_URL=http://localhost:8080`
- `HAAABIT_PUBLIC_PORT=8080` is optional and only needed when the host port should differ from the URL default

Advanced overrides remain optional:

- `DATABASE_URL`
- `API_INTERNAL_BASE_URL`
- `BETTER_AUTH_URL`
- `CORS_ORIGIN`

### First install

The official install flow is two-step on purpose.

#### Step 1: Prepare and initialize

Build the runtime images and apply migrations before first start:

```bash
docker compose build web api
docker compose run --rm migrate
```

`docker compose run --rm migrate` is the canonical schema lifecycle command. It also handles first-time SQLite file creation for the default `file:/data/haaabit.db` path.

#### Step 2: Start and verify

Start the stack and run the top-level health check:

```bash
docker compose up -d
./scripts/self-host/check.sh
```

If the health check passes, open `${APP_BASE_URL}/` to register.

### After installation

- **First user is admin**: the first account registered is automatically promoted to admin and can toggle whether new user registration is allowed.
- **API access**: each user can generate a personal API token from the API Access page. Tokens are hashed with SHA-256 at rest — the plaintext is shown only once on creation.
- **Interactive API docs**: visit `${APP_BASE_URL}/api/docs` for the full OpenAPI documentation, or fetch the spec at `${APP_BASE_URL}/api/openapi.json`.

### Locale behavior for operators

The shipped product uses one shared locale model for the main app and docs surfaces:

- On first visit, the app chooses between Chinese and English from the browser language.
- Unsupported browser locales fall back to English.
- The user can switch language from the auth page and from the signed-in shell.
- Once a user switches language manually, the browser remembers that preference with the `haaabit-locale` cookie.
- The main app keeps the same route structure instead of using `/zh` or `/en` route prefixes.

### What the health check validates

`./scripts/self-host/check.sh` verifies:

- `proxy`, `web`, and `api` are running
- `${APP_BASE_URL}/health` returns `{ "ok": true }`
- `${APP_BASE_URL}/api/openapi.json` is reachable
- the web entrypoint returns HTML through the public proxy

### Troubleshooting

#### `BETTER_AUTH_SECRET is required`

Your `.env` is missing `BETTER_AUTH_SECRET`, or it is too short. Generate a new one with `openssl rand -hex 32`.

#### `APP_BASE_URL` does not match where you are browsing

Set `APP_BASE_URL` to the actual public URL operators will use, including the port when not using default HTTP ports.

#### `docker compose run --rm migrate` fails on first install

Re-run it before `docker compose up -d`. The runtime services are not expected to initialize schema automatically.

#### `/health` works but `/api/*` does not

This indicates the proxy is up but API routing is wrong. Re-check `docker-compose.yml`, `docker/caddy/Caddyfile`, and rerun `./scripts/self-host/check.sh`.

#### The web app starts but server-side data loads fail

Check `API_INTERNAL_BASE_URL`. In the official topology it should keep pointing at `http://api:3001`.

### Rehearsal helpers

For repeatable operator-path checks:

```bash
./scripts/self-host/verify-clean-install.sh
./scripts/self-host/verify-upgrade.sh
```

These scripts are intended to mirror the documented flow rather than replace it.

## 中文

### 拓扑

- `proxy` 是唯一对外发布的服务。
- `web` 提供 Next.js 应用。
- `api` 提供 auth、habit API、today API、stats 和 OpenAPI。
- `migrate` 是首次安装和升级时使用的一次性 operator 命令。

默认情况下，整套服务会把数据保存在 Docker named volume 中，并通过 `http://localhost:8080` 提供访问。

### 前置条件

- Docker Desktop，或带 Compose v2 的 Docker Engine
- 能运行下面命令的 shell 环境

### 配置

1. 复制示例文件：

```bash
cp .env.example .env
```

2. 生成密钥：

```bash
openssl rand -hex 32
```

3. 编辑 `.env`，至少设置：

- `APP_BASE_URL`
- `BETTER_AUTH_SECRET`

首次安装的默认值：

- `APP_BASE_URL=http://localhost:8080`
- `HAAABIT_PUBLIC_PORT=8080` 是可选项，只有当宿主机端口需要和默认 URL 端口不一致时才需要设置

高级覆盖项仍然是可选的：

- `DATABASE_URL`
- `API_INTERNAL_BASE_URL`
- `BETTER_AUTH_URL`
- `CORS_ORIGIN`

### 首次安装

官方安装流程刻意分成两步。

#### 第一步：准备并初始化

先构建运行时镜像，再在首次启动前执行 migrations：

```bash
docker compose build web api
docker compose run --rm migrate
```

`docker compose run --rm migrate` 是标准的 schema 生命周期命令；对于默认的 `file:/data/haaabit.db` 路径，它也会负责首次创建 SQLite 文件。

#### 第二步：启动并验证

启动整套服务，并执行顶层健康检查：

```bash
docker compose up -d
./scripts/self-host/check.sh
```

如果健康检查通过，请打开 `${APP_BASE_URL}/` 注册账号。

### 安装后

- **首个用户即管理员**：首个注册的账号会自动成为管理员，可以开关是否允许新用户注册。
- **API 访问**：每个用户可以在 API Access 页面生成个人 API Token。Token 以 SHA-256 哈希存储，明文仅在创建时展示一次。
- **交互式 API 文档**：访问 `${APP_BASE_URL}/api/docs` 查看完整的 OpenAPI 文档，或通过 `${APP_BASE_URL}/api/openapi.json` 获取规范文件。

### 面向 operator 的语言行为说明

当前已发布产品在主应用和文档相关页面上使用同一套语言行为：

- 首次访问时，应用会根据浏览器语言在中文和英文之间选择默认语言。
- 如果浏览器语言不受支持，会回退到英文。
- 用户可以在登录页和登录后的应用 shell 中手动切换语言。
- 一旦用户手动切换语言，浏览器会通过 `haaabit-locale` cookie 记住该偏好。
- 主应用保持同一套路由结构，不使用 `/zh` 或 `/en` 这样的语言前缀路由。

### 健康检查会验证什么

`./scripts/self-host/check.sh` 会验证：

- `proxy`、`web` 和 `api` 都在运行
- `${APP_BASE_URL}/health` 返回 `{ "ok": true }`
- `${APP_BASE_URL}/api/openapi.json` 可访问
- web 入口能通过公网 `proxy` 正常返回 HTML

### 故障排查

#### `BETTER_AUTH_SECRET is required`

说明你的 `.env` 缺少 `BETTER_AUTH_SECRET`，或者它太短。请重新用 `openssl rand -hex 32` 生成一个。

#### `APP_BASE_URL` 和你实际访问的地址不一致

请把 `APP_BASE_URL` 设置成 operator 实际会访问的公网 URL；如果不是默认 HTTP 端口，也要把端口带上。

#### `docker compose run --rm migrate` 在首次安装时失败

请在 `docker compose up -d` 之前重新运行它。运行时服务不会自动帮你初始化 schema。

#### `/health` 正常，但 `/api/*` 不正常

这通常意味着 `proxy` 已经起来了，但 API 路由有问题。请重新检查 `docker-compose.yml`、`docker/caddy/Caddyfile`，然后再次运行 `./scripts/self-host/check.sh`。

#### Web 能打开，但服务端数据加载失败

请检查 `API_INTERNAL_BASE_URL`。在官方拓扑下，它应该继续指向 `http://api:3001`。

### 演练辅助脚本

如果你想重复验证 operator 路径，可以运行：

```bash
./scripts/self-host/verify-clean-install.sh
./scripts/self-host/verify-upgrade.sh
```

这些脚本的目标是复现文档里的流程，而不是替代文档本身。
