#!/usr/bin/env python3
"""purpose --- run one sudo command via ash sudo_broker socket (deploy helper)."""
import json
import socket
import sys
from pathlib import Path

SOCKET = Path("/home/ash/3x-ui/sudo_broker.sock")
TOKEN_FILE = Path("/home/ash/.x-ui-server-setup/broker.token")


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: broker-sudo.py '<shell command>'", file=sys.stderr)
        return 1
    command = sys.argv[1]
    token = TOKEN_FILE.read_text(encoding="utf-8").strip()
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    sock.connect(str(SOCKET))
    sock.sendall(json.dumps({"token": token, "command": command}).encode("utf-8"))
    response = json.loads(sock.recv(65536).decode("utf-8"))
    if response.get("stdout"):
        print(response["stdout"], end="")
    if response.get("stderr"):
        print(response["stderr"], end="", file=sys.stderr)
    return int(response.get("exit_code", 1))


if __name__ == "__main__":
    raise SystemExit(main())
