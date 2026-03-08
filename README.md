# Haaabit

Self-hosted habit tracking focused on making "what should I do today?" legible to both humans and AI callers.

自托管习惯追踪工具，让人和 AI 都能更清楚地知道“今天该做什么”。

## Docs

- Bilingual self-host docs live in the repository and keep commands, paths, headers, and other technical literals in English for copyability.
- 双语自托管文档直接保存在仓库里；命令、路径、header 和其他技术字面量保持英文，便于直接复制使用。

- [Self-host install guide / 自托管安装指南](./docs/self-hosting.md)
- [Self-host upgrade guide / 自托管升级指南](./docs/self-hosting-upgrades.md)

## English Quickstart

The official self-hosted path is a single public entrypoint backed by three services:

- `proxy` for public routing
- `web` for the Next.js app
- `api` for auth, habits, today, stats, and OpenAPI

Quick commands:

```bash
cp .env.example .env
docker compose build web api
docker compose run --rm migrate
docker compose up -d
./scripts/self-host/check.sh
```

Use the install guide for the full two-step setup and locale-behavior notes, then use the upgrade guide for backup-first releases.

## 中文快速开始

官方自托管路径只有一个对外入口，由三个服务组成：

- `proxy` 负责公网入口和路由转发
- `web` 负责 Next.js 应用
- `api` 负责 auth、habits、today、stats 和 OpenAPI

快速命令：

```bash
cp .env.example .env
docker compose build web api
docker compose run --rm migrate
docker compose up -d
./scripts/self-host/check.sh
```

完整的两步安装流程、语言行为说明和升级前备份流程，请分别查看上面的安装指南与升级指南。
