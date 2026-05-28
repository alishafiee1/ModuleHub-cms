#!/usr/bin/env python3
"""purpose --- keep sudo password in RAM; run commands via local Unix socket."""

from __future__ import annotations

import getpass
import json
import os
import socket
import subprocess
import sys
import threading
from pathlib import Path
from typing import Any

def get_user_home() -> Path:
    """Resolve the original user's home directory even when running under sudo."""
    sudo_user = os.environ.get("SUDO_USER")
    if sudo_user:
        home_path = Path("/home") / sudo_user
        if home_path.exists():
            return home_path
    return Path.home()


USER_HOME = get_user_home()

SOCKET_PATH = (
    Path(os.environ["SUDO_BROKER_SOCKET"]).expanduser()
    if os.environ.get("SUDO_BROKER_SOCKET")
    else USER_HOME / "3x-ui" / "sudo_broker.sock"
)
TOKEN_PATH = USER_HOME / ".x-ui-server-setup" / "broker.token"


def sudo_validate(password: str) -> bool:
    """Check sudo password with sudo -v."""
    result = subprocess.run(
        ["sudo", "-S", "-v"],
        input=f"{password}\n",
        text=True,
        capture_output=True,
        timeout=30,
    )
    return result.returncode == 0


def sudo_run(password: str, command: str, already_root: bool = False) -> dict[str, Any]:
    """Run one shell command as root."""
    if already_root:
        result = subprocess.run(
            ["bash", "-c", command],
            text=True,
            capture_output=True,
            timeout=600,
        )
    else:
        result = subprocess.run(
            ["sudo", "-S", "bash", "-c", command],
            input=f"{password}\n",
            text=True,
            capture_output=True,
            timeout=600,
        )
    return {"exit_code": result.returncode, "stdout": result.stdout, "stderr": result.stderr}


def refresh_loop(password: str, stop: threading.Event) -> None:
    """Refresh sudo ticket every 60s (skipped when already root)."""
    while not stop.wait(60):
        subprocess.run(
            ["sudo", "-S", "-v"],
            input=f"{password}\n",
            text=True,
            capture_output=True,
        )


def serve(password: str, token: str, already_root: bool = False) -> None:
    """Listen on Unix socket until Ctrl+C."""
    SOCKET_PATH.parent.mkdir(parents=True, exist_ok=True)
    if SOCKET_PATH.exists():
        SOCKET_PATH.unlink()
    server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    server.bind(str(SOCKET_PATH))
    server.listen(5)
    os.chmod(SOCKET_PATH, 0o666)
    print(f"Broker ready. Socket={SOCKET_PATH}")
    try:
        while True:
            conn, _ = server.accept()
            with conn:
                req = json.loads(conn.recv(65536).decode("utf-8"))
                if req.get("token") != token:
                    conn.sendall(b'{"error":"invalid token"}')
                    continue
                out = sudo_run(password, req["command"], already_root=already_root)
                conn.sendall(json.dumps(out, ensure_ascii=False).encode("utf-8"))
    finally:
        server.close()
        SOCKET_PATH.unlink(missing_ok=True)


def main() -> int:
    """Ask password once; start broker."""
    print("sudo broker — Ctrl+C to stop")
    already_root = os.geteuid() == 0
    password = ""

    if already_root:
        print("[OK] Running as root — no second password prompt.")
    else:
        linux_user = os.environ.get("USER") or os.environ.get("LOGNAME") or "your-user"
        password = getpass.getpass(f"Linux sudo password (user {linux_user}): ")
        if not sudo_validate(password):
            print("Wrong Linux sudo password.")
            return 1

    TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)
    token = os.urandom(16).hex()
    TOKEN_PATH.write_text(token)
    TOKEN_PATH.chmod(0o600)
    stop = threading.Event()
    if not already_root:
        threading.Thread(target=refresh_loop, args=(password, stop), daemon=True).start()
    try:
        serve(password, token, already_root=already_root)
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        stop.set()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
