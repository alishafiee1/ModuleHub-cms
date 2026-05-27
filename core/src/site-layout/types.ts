import { z } from 'zod';

export const LayoutPageTypeSchema = z.enum(['builtin', 'standalone']);
export type LayoutPageType = z.infer<typeof LayoutPageTypeSchema>;

export const LayoutItemKindSchema = z.enum(['module', 'folder', 'admin-add']);
export type LayoutItemKind = z.infer<typeof LayoutItemKindSchema>;

export const SiteLayoutFolderSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  parentId: z.string().nullable(),
});

export type SiteLayoutFolder = z.infer<typeof SiteLayoutFolderSchema>;

const layoutItemBase = {
  id: z.string().min(1),
  folderId: z.string().min(1),
  title: z.string().min(1),
  sortOrder: z.number().int().min(0),
};

export const SiteLayoutModuleItemSchema = z.object({
  ...layoutItemBase,
  kind: z.literal('module'),
  subtitle: z.string().min(1),
  iconClass: z.string().optional(),
  icon: z.string().optional(),
  pageType: LayoutPageTypeSchema,
  route: z.string().min(1),
});

export const SiteLayoutFolderItemSchema = z.object({
  ...layoutItemBase,
  kind: z.literal('folder'),
  subtitle: z.string().optional(),
  targetFolderId: z.string().min(1),
  iconClass: z.string().optional(),
});

export const SiteLayoutAdminAddItemSchema = z.object({
  ...layoutItemBase,
  kind: z.literal('admin-add'),
  subtitle: z.string().optional(),
});

export const SiteLayoutItemSchema = z.discriminatedUnion('kind', [
  SiteLayoutModuleItemSchema,
  SiteLayoutFolderItemSchema,
  SiteLayoutAdminAddItemSchema,
]);

export type SiteLayoutItem = z.infer<typeof SiteLayoutItemSchema>;
export type SiteLayoutModuleItem = z.infer<typeof SiteLayoutModuleItemSchema>;

export const SiteLayoutSchema = z
  .object({
    siteTitle: z.string().min(1),
    siteSubtitle: z.string().min(1),
    rootFolderId: z.string().min(1),
    folders: z.array(SiteLayoutFolderSchema).min(1),
    items: z.array(SiteLayoutItemSchema),
  })
  .superRefine((data, ctx) => {
    const folderIds = new Set(data.folders.map((folder) => folder.id));
    if (!folderIds.has(data.rootFolderId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'rootFolderId must reference an existing folder',
        path: ['rootFolderId'],
      });
    }
    for (const folder of data.folders) {
      if (folder.parentId !== null && !folderIds.has(folder.parentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `folder ${folder.id} has unknown parentId ${folder.parentId}`,
          path: ['folders'],
        });
      }
    }
    for (const item of data.items) {
      if (!folderIds.has(item.folderId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `item ${item.id} has unknown folderId ${item.folderId}`,
          path: ['items'],
        });
      }
      if (item.kind === 'folder' && !folderIds.has(item.targetFolderId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `folder item ${item.id} has unknown targetFolderId`,
          path: ['items'],
        });
      }
    }
  });

export type SiteLayoutData = z.infer<typeof SiteLayoutSchema>;

export const DEFAULT_ROOT_FOLDER_ID = 'root';

/** Default root folder node for v3 layouts. */
export function createDefaultRootFolder(): SiteLayoutFolder {
  return { id: DEFAULT_ROOT_FOLDER_ID, title: 'خانه', parentId: null };
}
