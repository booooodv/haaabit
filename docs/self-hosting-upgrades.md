# Self-hosting upgrades / 自托管升级

## English

Upgrades are intentionally conservative:

1. stop the stack
2. take a backup
3. rebuild images
4. run migrations explicitly
5. start the stack again
6. rerun the health check

### Backup-first upgrade flow

#### 1. Stop the stack

```bash
docker compose down
```

#### 2. Create a SQLite backup

Run the backup while the stack is stopped so the SQLite file is not changing underneath you:

```bash
docker compose run --rm --no-deps migrate sh -lc 'cp /data/haaabit.db /data/haaabit.backup.$(date +%Y%m%d%H%M%S).db'
```

This uses the same named volume that backs the default production database.

#### 3. Update the code

Pull the new revision or replace the working tree with the version you want to run.

#### 4. Rebuild the runtime images

```bash
docker compose build web api
```

#### 5. Apply migrations explicitly

```bash
docker compose run --rm migrate
```

#### 6. Start the stack again

```bash
docker compose up -d
```

#### 7. Re-verify health

```bash
./scripts/self-host/check.sh
```

If the health check fails, stop here and inspect the stack before resuming use.

### Persisted-volume rehearsal

The repository includes a repeatable upgrade rehearsal:

```bash
./scripts/self-host/verify-upgrade.sh
```

It exercises:

- first install on a fresh volume
- a backup taken from an existing volume
- an explicit `docker compose run --rm migrate`
- a controlled restart
- a final public-entrypoint health check

### Common upgrade failures

#### Backup file was never created

Re-run the backup step before rebuilding or migrating. The official path assumes you have a recoverable copy before any schema change.

#### `migrate` succeeds but the app still fails after restart

Run `./scripts/self-host/check.sh` and inspect which of:

- `proxy`
- `web`
- `api`

failed to come back healthy.

#### Operators changed `.env` and forgot the public URL

If `APP_BASE_URL` changed, re-run the health check against the actual URL you expect users to visit.

For the base install flow and locale-behavior notes, return to [the install guide](./self-hosting.md).

## 中文

升级流程刻意保持保守：

1. 停掉整套服务
2. 先做备份
3. 重建镜像
4. 显式执行 migrations
5. 再次启动服务
6. 重新跑健康检查

### 先备份再升级的流程

#### 1. 停止服务

```bash
docker compose down
```

#### 2. 创建 SQLite 备份

请在整套服务停止后执行备份，这样 SQLite 文件不会在复制时继续变化：

```bash
docker compose run --rm --no-deps migrate sh -lc 'cp /data/haaabit.db /data/haaabit.backup.$(date +%Y%m%d%H%M%S).db'
```

这里使用的是默认生产数据库所在的同一个 named volume。

#### 3. 更新代码

拉取新版本，或者把工作树替换成你准备运行的那个版本。

#### 4. 重建运行时镜像

```bash
docker compose build web api
```

#### 5. 显式执行 migrations

```bash
docker compose run --rm migrate
```

#### 6. 再次启动整套服务

```bash
docker compose up -d
```

#### 7. 重新验证健康状态

```bash
./scripts/self-host/check.sh
```

如果健康检查失败，请先停在这里排查，不要继续恢复使用。

### 持久化 volume 升级演练

仓库里提供了一个可重复执行的升级演练脚本：

```bash
./scripts/self-host/verify-upgrade.sh
```

它会覆盖这些步骤：

- 在全新 volume 上进行首次安装
- 从已有 volume 创建备份
- 显式执行一次 `docker compose run --rm migrate`
- 进行受控重启
- 最后通过公网入口再次执行健康检查

### 常见升级失败场景

#### 没有真正生成备份文件

请先重新执行备份步骤，再去重建镜像或运行 migration。官方升级路径默认你在任何 schema 变化之前都已经有可恢复的备份。

#### `migrate` 成功了，但重启后应用仍然失败

运行 `./scripts/self-host/check.sh`，并检查下面哪个服务没有恢复健康：

- `proxy`
- `web`
- `api`

#### operator 改了 `.env`，却忘了同步公网 URL

如果 `APP_BASE_URL` 发生变化，请用你期望用户真正访问的 URL 重新执行健康检查。

安装流程和语言行为说明，请返回查看[安装指南](./self-hosting.md)。
