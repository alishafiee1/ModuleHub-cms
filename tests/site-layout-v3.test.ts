import { migrateV2LayoutToV3, parseSiteLayout } from '../core/src/site-layout/migration';
import { SiteLayoutSchema } from '../core/src/site-layout/types';

describe('site-layout v3 migration', () => {
  it('migrates flat v2 layout to v3 with root folder', () => {
    const migrated = migrateV2LayoutToV3({
      siteTitle: 'Test Site',
      siteSubtitle: 'Sub',
      items: [
        {
          id: 'demo-api',
          title: 'Demo',
          subtitle: 'API',
          pageType: 'standalone',
          route: '/modules/demo-api/',
          sortOrder: 1,
        },
      ],
    });

    expect(migrated.rootFolderId).toBe('root');
    expect(migrated.folders).toHaveLength(1);
    expect(migrated.items[0].folderId).toBe('root');
    expect(migrated.items[0].kind).toBe('module');
  });

  it('rejects orphan folder parentId', () => {
    const result = SiteLayoutSchema.safeParse({
      siteTitle: 'T',
      siteSubtitle: 'S',
      rootFolderId: 'root',
      folders: [
        { id: 'root', title: 'Home', parentId: null },
        { id: 'orphan', title: 'Bad', parentId: 'missing' },
      ],
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('parses v3 layout without migration', () => {
    const layout = parseSiteLayout({
      siteTitle: 'T',
      siteSubtitle: 'S',
      rootFolderId: 'root',
      folders: [{ id: 'root', title: 'Home', parentId: null }],
      items: [],
    });
    expect(layout.folders[0].id).toBe('root');
  });
});
