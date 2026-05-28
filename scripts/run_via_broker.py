#!/usr/bin/env python3
"""purpose --- send one command to sudo_broker and print JSON result."""

from __future__ import annotations

import json
import os
import socket
import sys
from pathlib import Path

SOCKET_PATH = Path(os.environ.get("SUDO_BROKER_SOCKET", "")).expanduser() if os.environ.get("SUDO_BROKER_SOCKET") else Path.home() / "3x-ui" / "sudo_broker.sock"
TOKEN_PATH = Path.home() / ".x-ui-server-setup" / "broker.token"


def send_command(command: str) -> dict:
    """Send command to broker and return response dict."""
    if not SOCKET_PATH.exists():
        raise FileNotFoundError(
            "Broker not running. Start: sudo python3 ~/3x-ui/sudo_broker.py"
        )
    token = TOKEN_PATH.read_text(encoding="utf-8").strip()
    payload = json.dumps({"token": token, "command": command})
    client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    client.connect(str(SOCKET_PATH))
    client.sendall(payload.encode("utf-8"))
    client.shutdown(socket.SHUT_WR)
    response = client.recv(1_000_000).decode("utf-8")
    client.close()
    return json.loads(response)


def main() -> int:
    """CLI: python3 run_via_broker.py 'your command'."""
    if len(sys.argv) < 2:
        print("Usage: python3 run_via_broker.py '<shell command>'")
        return 2
    command = " ".join(sys.argv[1:])
    result = send_command(command)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return int(result.get("exit_code", 1))


if __name__ == "__main__":
    raise SystemExit(main())
