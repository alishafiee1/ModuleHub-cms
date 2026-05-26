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

  it('bootstraps default layout from modules', () => {
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
    ]);
    const data = registry.getData();
    expect(data.items).toHaveLength(1);
    expect(data.items[0].route).toBe('/pages/sample-gallery/');
    expect(data.siteTitle).toBe('ModuleHub CMS');
  });

  it('validates layout on setData', () => {
    const result = registry.setData({
      siteTitle: 'Test',
      siteSubtitle: 'Sub',
      items: [{ id: 'x', title: 'X', subtitle: 's', pageType: 'builtin', route: '/pages/x/', sortOrder: 0 }],
    });
    expect(result.success).toBe(true);
    expect(registry.getData().items[0].title).toBe('X');
  });
});
