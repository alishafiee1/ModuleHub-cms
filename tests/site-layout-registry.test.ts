import fs from 'fs';
import os from 'os';
import path from 'path';
import { SiteLayoutRegistry } from '../core/src/site-layout/registry';

describe('SiteLayoutRegistry', () => {
  let tmpDir: string;
  let registry: SiteLayoutRegistry;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-layout-'));
    registry = new SiteLayoutRegistry(path.join(tmpDir, 'site-layout.json'));
    registry.load();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('bootstraps default layout from modules when includeBuiltinDemos is true', () => {
    registry.bootstrapFromModules(
      [
        {
          id: 'sample-gallery',
          name: 'Gallery',
          type: 'builtin',
          version: '1',
          icon: 'g.png',
          description: 'Gallery page',
          status: 'static',
          installPath: '/tmp/g',
          createdAt: '',
          updatedAt: '',
        },
      ],
      { includeBuiltinDemos: true },
    );
    const data = registry.getData();
    expect(data.items).toHaveLength(1);
    expect(data.items[0].kind).toBe('module');
    if (data.items[0].kind === 'module') {
      expect(data.items[0].route).toBe('/pages/sample-gallery/');
    }
    expect(data.items[0].folderId).toBe('root');
    expect(data.folders[0].id).toBe('root');
  });

  it('skips builtin modules in bootstrap by default', () => {
    registry.bootstrapFromModules([
      {
        id: 'sample-gallery',
        name: 'Gallery',
        type: 'builtin',
        version: '1',
        icon: 'g.png',
        description: 'Gallery page',
        status: 'static',
        installPath: '/tmp/g',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'demo-api',
        name: 'Demo API',
        type: 'standalone',
        version: '1',
        icon: 'a.png',
        description: 'API',
        status: 'stopped',
        installPath: '/tmp/api',
        createdAt: '',
        updatedAt: '',
      },
    ]);
    expect(registry.getData().items).toHaveLength(1);
    expect(registry.getData().items[0].id).toBe('demo-api');
  });

  it('validates v3 layout on setData', () => {
    const result = registry.setData({
      siteTitle: 'Test',
      siteSubtitle: 'Sub',
      rootFolderId: 'root',
      folders: [{ id: 'root', title: 'Home', parentId: null }],
      items: [
        {
          id: 'x',
          folderId: 'root',
          kind: 'module',
          title: 'X',
          subtitle: 's',
          pageType: 'builtin',
          route: '/pages/x/',
          sortOrder: 0,
        },
      ],
    });
    expect(result.success).toBe(true);
    expect(registry.getData().items[0].title).toBe('X');
  });

  it('adds folder under parent', () => {
    registry.setData({
      siteTitle: 'Test',
      siteSubtitle: 'Sub',
      rootFolderId: 'root',
      folders: [{ id: 'root', title: 'Home', parentId: null }],
      items: [],
    });
    const result = registry.addFolder('root', 'Portfolio', 'portfolio');
    expect(result.success).toBe(true);
    expect(registry.getData().folders.some((f) => f.id === 'portfolio')).toBe(true);
  });

  it('migrates v2 file on load', () => {
    const layoutPath = path.join(tmpDir, 'site-layout.json');
    fs.writeFileSync(
      layoutPath,
      JSON.stringify({
        siteTitle: 'Legacy',
        siteSubtitle: 'Old',
        items: [
          {
            id: 'a',
            title: 'A',
            subtitle: 's',
            pageType: 'builtin',
            route: '/pages/a/',
            sortOrder: 1,
          },
        ],
      }),
    );
    const loaded = new SiteLayoutRegistry(layoutPath);
    loaded.load();
    const data = loaded.getData();
    expect(data.rootFolderId).toBe('root');
    expect(data.items[0].kind).toBe('module');
  });
});
