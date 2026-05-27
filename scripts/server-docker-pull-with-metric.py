#!/usr/bin/env python3
"""Temporarily switch default route to free internet, docker compose pull, restore."""
import os
import subprocess
import sys

sys.path.insert(0, os.path.expanduser("~/3x-ui/server_diagnostics"))
from core.network_metric_toggler import NetworkMetricToggler  # noqa: E402


def main() -> int:
    """Toggle metric, pull images, restore metrics."""
    demo_dir = "/opt/modulehub-cms/standalone-modules/demo-api"
    toggler = NetworkMetricToggler("enp63s0")
    if not toggler.set_free_internet_primary():
        print("ERROR: metric toggle failed", file=sys.stderr)
        return 1
    print("metric: free internet primary")
    try:
        curl = subprocess.run(
            [
                "curl",
                "-s",
                "-o",
                "/dev/null",
                "-w",
                "auth.docker.io: %{http_code}\n",
                "--max-time",
                "15",
                "https://auth.docker.io",
            ],
            capture_output=True,
            text=True,
        )
        print(curl.stdout.strip())
        if os.path.isdir(demo_dir):
            pull = subprocess.run(
                ["docker", "compose", "pull"],
                cwd=demo_dir,
                capture_output=True,
                text=True,
            )
            print("compose pull exit:", pull.returncode)
            tail = (pull.stderr or pull.stdout)[-800:]
            if tail:
                print(tail)
        else:
            print("skip: no demo-api dir at", demo_dir)
    finally:
        toggler.restore_default_metrics()
        print("metric: restored")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
