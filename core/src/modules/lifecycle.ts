/**
 * Standalone module lifecycle transitions (settings flow replaces legacy Approve).
 */
import { ModuleStatus } from './types';

/** Allowed status transitions for standalone/instance modules. */
export const MODULE_STATUS_TRANSITIONS: Readonly<Record<ModuleStatus, readonly ModuleStatus[]>> = {
  installing: ['settings_pending', 'error'],
  settings_pending: ['running', 'stopped', 'error'],
  running: ['stopped', 'error'],
  stopped: ['running', 'error', 'settings_pending'],
  error: ['settings_pending', 'stopped', 'running'],
  static: ['static'],
};

/**
 * Return whether a module status transition is allowed.
 */
export function canTransitionModuleStatus(from: ModuleStatus, to: ModuleStatus): boolean {
  if (from === to) {
    return true;
  }
  return MODULE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Assert transition is valid; throws when disallowed.
 */
export function assertModuleStatusTransition(from: ModuleStatus, to: ModuleStatus): void {
  if (!canTransitionModuleStatus(from, to)) {
    throw new Error(`Invalid module status transition: ${from} → ${to}`);
  }
}

/** HTTP body for deprecated approve endpoint. */
export const DEPRECATED_APPROVE_MESSAGE =
  'POST /modules/:id/approve is deprecated. Complete module settings (Save Settings) instead.';
