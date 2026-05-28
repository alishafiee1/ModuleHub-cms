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


TEMP_PREFERRED_METRIC = 50
TEMP_OTHER_METRIC = 500


def change_default_route_metric(route: DefaultRoute, metric: int) -> None:
    """
    Change metric on an existing default route (no add/delete).

    Args:
        route: Parsed default route with via and dev
        metric: New metric value
    """
    if route.via is None:
        return
    run_command(
        [
            "ip",
            "route",
            "change",
            "default",
            "via",
            route.via,
            "dev",
            route.dev,
            "metric",
            str(metric),
        ],
        check=False,
    )


def apply_interface_preference(preferred_interface: str) -> List[DefaultRoute]:
    """
    Temporarily prefer one NIC by lowering its default-route metric.

    Args:
        preferred_interface: Interface for outbound traffic (e.g. enp63s0)

    Returns:
        Snapshot of routes before changes (for restore)
    """
    snapshot = get_default_routes()
    seen: set[tuple[str, str, Optional[int]]] = set()
    for route in snapshot:
        key = (route.dev, route.via or "", route.metric)
        if key in seen or route.via is None:
            continue
        seen.add(key)
        if route.dev == preferred_interface:
            change_default_route_metric(route, TEMP_PREFERRED_METRIC)
        else:
            change_default_route_metric(route, TEMP_OTHER_METRIC)
    return snapshot


def restore_default_routes(snapshot: List[DefaultRoute]) -> None:
    """
    Restore original default-route metrics from snapshot.

    Args:
        snapshot: Routes captured before apply_interface_preference
    """
    seen: set[tuple[str, str, Optional[int]]] = set()
    for route in snapshot:
        key = (route.dev, route.via or "", route.metric)
        if key in seen or route.via is None or route.metric is None:
            continue
        seen.add(key)
        change_default_route_metric(route, route.metric)


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

    snapshot = apply_interface_preference(interface)
    LOG.info("Temporary metrics: %s=%s, others=%s", interface, TEMP_PREFERRED_METRIC, TEMP_OTHER_METRIC)

    exit_code = 1
    try:
        result = subprocess.run(shell_command, shell=True, check=False)
        exit_code = result.returncode
        if exit_code != 0:
            LOG.error("Command failed with exit code %s: %s", exit_code, shell_command)
    finally:
        restore_default_routes(snapshot)
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
