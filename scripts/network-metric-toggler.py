#!/usr/bin/env python3
# purpose --- Temporarily route outbound traffic via a chosen NIC for package installs (dual-WAN) ------
"""
Toggle default-route metric on a selected interface, run a shell command, then restore routes.
Does not modify netplan or permanent configuration.

Usage:
  python3 scripts/network-metric-toggler.py --interface enp63s0 --command "npm install"
"""

from __future__ import annotations

import argparse
import logging
import re
import subprocess
import sys
from dataclasses import dataclass
from typing import List, Optional

LOG = logging.getLogger("network_metric_toggler")


@dataclass
class DefaultRoute:
    """Parsed default route line from `ip route show default`."""

    via: Optional[str]
    dev: str
    metric: Optional[int]
    raw: str


def run_command(command: List[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    """
    Run a subprocess and return completed process.

    Args:
        command: argv list
        check: raise on non-zero exit

    Returns:
        Completed process with decoded stdout/stderr
    """
    return subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=check,
    )


def parse_default_routes(output: str) -> List[DefaultRoute]:
    """
    Parse `ip route show default` output into structured routes.

    Args:
        output: stdout from ip route

    Returns:
        List of default routes (may be empty)
    """
    routes: List[DefaultRoute] = []
    for line in output.strip().splitlines():
        via_match = re.search(r"\bvia\s+(\S+)", line)
        dev_match = re.search(r"\bdev\s+(\S+)", line)
        metric_match = re.search(r"\bmetric\s+(\d+)", line)
        if not dev_match:
            continue
        routes.append(
            DefaultRoute(
                via=via_match.group(1) if via_match else None,
                dev=dev_match.group(1),
                metric=int(metric_match.group(1)) if metric_match else None,
                raw=line.strip(),
            )
        )
    return routes


def get_default_routes() -> List[DefaultRoute]:
    """Return current default routes."""
    result = run_command(["ip", "route", "show", "default"])
    return parse_default_routes(result.stdout)


def add_preferred_route(interface: str, metric: int = 50) -> Optional[str]:
    """
    Add a temporary default route via the given interface with lower metric.

    Args:
        interface: NIC name (e.g. enp63s0)
        metric: route metric (lower = preferred)

    Returns:
        Gateway IP used, or None if route could not be added
    """
    link_result = run_command(["ip", "-4", "route", "show", "dev", interface], check=False)
    gateway: Optional[str] = None
    for line in link_result.stdout.splitlines():
        via_match = re.search(r"\bvia\s+(\S+)", line)
        if via_match:
            gateway = via_match.group(1)
            break
    if gateway is None:
        LOG.warning("No gateway found on %s — skipping temporary route", interface)
        return None

    run_command(
        ["ip", "route", "add", "default", "via", gateway, "dev", interface, "metric", str(metric)]
    )
    return gateway


def remove_temporary_route(interface: str, gateway: str, metric: int = 50) -> None:
    """
    Remove the temporary default route added for installs.

    Args:
        interface: NIC name
        gateway: gateway IP used when adding
        metric: metric value used when adding
    """
    run_command(
        ["ip", "route", "del", "default", "via", gateway, "dev", interface, "metric", str(metric)],
        check=False,
    )


def run_with_metric_toggle(interface: str, shell_command: str) -> int:
    """
    Run shell_command while preferring the given interface, then restore routes.

    Args:
        interface: NIC for outbound installs
        shell_command: command to execute (shell=True)

    Returns:
        Exit code of the wrapped command
    """
    before = get_default_routes()
    LOG.info("Default routes before: %s", [route.raw for route in before])

    gateway = add_preferred_route(interface)
    exit_code = 1
    try:
        result = subprocess.run(shell_command, shell=True, check=False)
        exit_code = result.returncode
        if exit_code != 0:
            LOG.error("Command failed with exit code %s: %s", exit_code, shell_command)
    finally:
        if gateway is not None:
            remove_temporary_route(interface, gateway)
        after = get_default_routes()
        LOG.info("Default routes after restore: %s", [route.raw for route in after])

    return exit_code


def build_argument_parser() -> argparse.ArgumentParser:
    """Build CLI argument parser."""
    parser = argparse.ArgumentParser(
        description="Run a command with temporary default-route preference on an interface.",
    )
    parser.add_argument(
        "--interface",
        required=True,
        help="Network interface for outbound traffic (e.g. enp63s0)",
    )
    parser.add_argument(
        "--command",
        required=True,
        help='Shell command to run (e.g. "npm install")',
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable debug logging",
    )
    return parser


def main() -> int:
    """CLI entry point."""
    parser = build_argument_parser()
    args = parser.parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="[%(levelname)s] %(message)s",
    )
    return run_with_metric_toggle(args.interface, args.command)


if __name__ == "__main__":
    sys.exit(main())
