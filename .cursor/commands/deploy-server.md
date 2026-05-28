# Deploy ModuleHub CMS to production server

You have SSH access to `ash@192.168.88.50`. Deploy only after changes are pushed to GitHub (`main`). The server uses **dual-WAN**: `git pull` and `npm` need temporary free internet via `enp63s0` (`run-with-free-wan.sh`).

## Architecture (do not confuse paths)

| Path | Role |
|------|------|
| `~/ModuleHub-cms` | Git clone — `git pull` here |
| `/opt/modulehub-cms` | Live app — systemd + Nginx target |
| Never lost on deploy | `/opt/modulehub-cms/.env`, `storage/`, `standalone-modules/`, `thumbnails/` |

Flow: **PC push → server `git pull` in home → `install-to-opt` (rsync) → `deploy-on-server` in `/opt`**.

## Phase A — Local (Windows), before SSH

```powershell
cd "D:\2 Curent project git\ModuleHub-cms"
npm run lint
npm run test
npm run build
git status
# commit only if user asked; never commit .env, storage/, standalone-modules/
git push origin main
```

Stop if lint/test/build fail. Do not push secrets.

## Phase B — Server deploy (standard)

SSH and run **as user `ash`** (bash, not PowerShell). Always prefix scripts with `bash scripts/...` (CRLF-safe).

```bash
source ~/.nvm/nvm.sh && nvm use 20
cd ~/ModuleHub-cms

bash scripts/run-with-free-wan.sh git pull origin main

bash scripts/install-to-opt.sh

cd /opt/modulehub-cms
bash scripts/deploy-on-server.sh --skip-pull

curl -sf http://127.0.0.1:4000/health
curl -s http://127.0.0.1:4000/api/auth/status
```

Success: health returns `{"status":"ok"}`. Tell user to hard-refresh browser (`Ctrl+Shift+R`) on `https://haderbash.ir`.

## Phase B — Recovery (git pull “would be overwritten”)

Only resets **home clone**, not `/opt` data:

```bash
source ~/.nvm/nvm.sh && nvm use 20
export MODULEHUB_SKIP_WAN=1
cd ~/ModuleHub-cms
git fetch origin
git reset --hard origin/main
bash scripts/install-to-opt.sh
cd /opt/modulehub-cms
bash scripts/deploy-on-server.sh --skip-pull
```

## Phase C — Dev admin (until phase 8 auth)

If UI shows `Super Admin session required` or `isSuperAdmin:false`:

```bash
python3 ~/ModuleHub-cms/scripts/broker-sudo.py \
  'bash /home/ash/ModuleHub-cms/scripts/enable-dev-admin-on-server.sh'
```

Re-check: `curl -s http://127.0.0.1:4000/api/auth/status` → `"isSuperAdmin":true`.

## Sudo — when password is required

| Step | Needs sudo? | Why |
|------|-------------|-----|
| `git pull` + `run-with-free-wan` | Sometimes | `ip route` via `network-metric-toggler.py` |
| `install-to-opt.sh` | Sometimes | `mkdir/chown` under `/opt` if missing |
| `deploy-on-server.sh` | **Yes** | `systemctl restart modulehub-cms`, install unit file |
| `enable-dev-admin-on-server.sh` | **Yes** | systemd drop-in / restart |

**Non-interactive SSH (AI):** do **not** run bare `sudo systemctl ...` (fails: “terminal required”). Use:

```bash
python3 ~/ModuleHub-cms/scripts/broker-sudo.py 'systemctl restart modulehub-cms'
```

If broker is missing or fails, **stop and ask the user** to either: (1) run `ssh -t ash@192.168.88.50` once and enter sudo password, (2) configure passwordless sudo for `systemctl`/`cp` for user `ash`, or (3) fix `broker-sudo.py` socket at `/home/ash/3x-ui/sudo_broker.sock`.

If `run-with-free-wan` crashes (`ip route add` error): `export MODULEHUB_SKIP_WAN=1` and retry pull/deploy (user must ensure GitHub is reachable another way).

## Debug quick map

| Symptom | Action |
|---------|--------|
| `git pull` overwrite | Recovery block (`reset --hard`) |
| `npm: command not found` | `source ~/.nvm/nvm.sh && nvm use 20` |
| `tsc` / `express` missing | Full `deploy-on-server.sh --skip-pull` (not `--skip-build`) |
| Health OK, old UI | `install-to-opt.sh` + browser hard refresh |
| Admin locked | `enable-dev-admin-on-server.sh` via broker |
| Service down | `python3 .../broker-sudo.py 'journalctl -u modulehub-cms -n 50 --no-pager'` |

## Rules for AI

- Never edit `scripts/` on server — change locally, push, redeploy.
- Never `npm run dev` on server.
- On Ubuntu SSH use `export VAR=1`, never PowerShell `$env:VAR`.
- After deploy, report: git commit hash pulled, health curl output, auth status, any sudo/broker errors verbatim.

Reference: `docs/dev-workflow.md`, `docs/deploy-notes-for-ai.md`.
