import { z } from 'zod';

export const LayoutPageTypeSchema = z.enum(['builtin', 'standalone']);
export type LayoutPageType = z.infer<typeof LayoutPageTypeSchema>;

export const SiteLayoutItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  iconClass: z.string().optional(),
  icon: z.string().optional(),
  pageType: LayoutPageTypeSchema,
  route: z.string().min(1),
  sortOrder: z.number().int().min(0),
});

export type SiteLayoutItem = z.infer<typeof SiteLayoutItemSchema>;

export const SiteLayoutSchema = z.object({
  siteTitle: z.string().min(1),
  siteSubtitle: z.string().min(1),
  items: z.array(SiteLayoutItemSchema),
});

export type SiteLayoutData = z.infer<typeof SiteLayoutSchema>;
