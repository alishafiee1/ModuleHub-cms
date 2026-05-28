import fs from 'fs-extra';
import { getModuleDirectory, getModuleLogFilePath } from '../../config/paths';
import { readSiteLayout, writeSiteLayout } from '../home-layout/layout-store';
import type { SiteLayoutDocument } from '../home-layout/types';
import { stopModuleById } from '../module-manager/module-manager-service';
import { removeModuleNodeFromTree } from './layout-tree-removal';
import { assertValidModuleId } from './module-id-validator';

/**
 * Removes module from layout tree and modules map (in-memory).
 * @param layout - Current site layout
 * @param moduleId - Module id to remove
 * @returns Updated layout
 */
export function removeModuleFromLayout(
  layout: SiteLayoutDocument,
  moduleId: string,
): SiteLayoutDocument {
  if (!layout.modules[moduleId]) {
    throw new Error(`Module "${moduleId}" not found`);
  }

  const removedFromTree = removeModuleNodeFromTree(layout.tree, moduleId);
  if (!removedFromTree) {
    throw new Error(`Module tree node for "${moduleId}" not found`);
  }

  delete layout.modules[moduleId];
  return layout;
}

/**
 * Stops module, deletes files, log, and layout entry.
 * @param moduleId - Module identifier
 */
export async function deleteModuleCompletely(moduleId: string): Promise<void> {
  assertValidModuleId(moduleId);

  const layout = await readSiteLayout();
  if (!layout.modules[moduleId]) {
    throw new Error(`Module "${moduleId}" not found`);
  }

  try {
    await stopModuleById(moduleId);
  } catch {
    // Module may already be stopped — continue cleanup
  }

  const moduleDirectory = getModuleDirectory(moduleId);
  if (await fs.pathExists(moduleDirectory)) {
    await fs.remove(moduleDirectory);
  }

  const logPath = getModuleLogFilePath(moduleId);
  if (await fs.pathExists(logPath)) {
    await fs.remove(logPath);
  }

  const updatedLayout = removeModuleFromLayout(layout, moduleId);
  await writeSiteLayout(updatedLayout);
}
