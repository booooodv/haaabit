# Self-hosting upgrades

Upgrades are intentionally conservative:

1. stop the stack
2. take a backup
3. rebuild images
4. run migrations explicitly
5. start the stack again
6. rerun the health check

## Backup-first upgrade flow

### 1. Stop the stack

```bash
docker compose down
```

### 2. Create a SQLite backup

Run the backup while the stack is stopped so the SQLite file is not changing underneath you:

```bash
docker compose run --rm --no-deps migrate sh -lc 'cp /data/haaabit.db /data/haaabit.backup.$(date +%Y%m%d%H%M%S).db'
```

This uses the same named volume that backs the default production database.

### 3. Update the code

Pull the new revision or replace the working tree with the version you want to run.

### 4. Rebuild the runtime images

```bash
docker compose build web api
```

### 5. Apply migrations explicitly

```bash
docker compose run --rm migrate
```

### 6. Start the stack again

```bash
docker compose up -d
```

### 7. Re-verify health

```bash
./scripts/self-host/check.sh
```

If the health check fails, stop here and inspect the stack before resuming use.

## Persisted-volume rehearsal

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

## Common upgrade failures

### Backup file was never created

Re-run the backup step before rebuilding or migrating. The official path assumes you have a recoverable copy before any schema change.

### `migrate` succeeds but the app still fails after restart

Run `./scripts/self-host/check.sh` and inspect which of:

- `proxy`
- `web`
- `api`

failed to come back healthy.

### Operators changed `.env` and forgot the public URL

If `APP_BASE_URL` changed, re-run the health check against the actual URL you expect users to visit.
