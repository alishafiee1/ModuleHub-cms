export { classifyModuleHosting, moduleNeedsProcess } from './module-classifier';
export {
  countRunningModules,
  isValidStatusTransition,
  validateConcurrentStartLimit,
} from './concurrent-limit';
export { resolveSpaFallbackIndexPath } from './spa-fallback';
export { startModuleById, stopModuleById, syncCrashedStatusIfProcessExited } from './module-manager-service';
export { createModuleManagementRouter } from './module-routes';
export { createModuleServingRouter, stripModuleUrlPrefix } from './module-serving-router';
export { clearAllRuntimeHandlesForTests } from './process-registry';
export { clearAutoRestartAttemptsForTests } from './auto-restart-tracker';
