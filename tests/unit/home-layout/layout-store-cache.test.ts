import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import validFixture from '../../fixtures/site-layout-valid.json';
import { parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';
import { migrateSiteLayoutCardGrid } from '../../../core/src/modules/home-layout/migrate-card-grid';

describe('readSiteLayoutWithMeta cache', () => {
  let tempRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-layout-cache-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    await fs.ensureDir(path.join(tempRoot, 'storage'));
    const base = migrateSiteLayoutCardGrid(parseSiteLayout(validFixture)).layout;
    await fs.writeJson(path.join(tempRoot, 'storage', 'site-layout.json'), base);
    jest.resetModules();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    await fs.remove(tempRoot);
  });

  it('reads site-layout.json from disk only once when mtime is unchanged', async () => {
    const layoutStore = await import('../../../core/src/modules/home-layout/layout-store');
    layoutStore.clearSiteLayoutCacheForTests();
    const readFileSpy = jest.spyOn(require('fs-extra'), 'readFile');

    await layoutStore.readSiteLayout();
    await layoutStore.readSiteLayout();

    const layoutReads = readFileSpy.mock.calls.filter(
      (call) => String(call[0]).endsWith('site-layout.json'),
    );
    expect(layoutReads).toHaveLength(1);

    readFileSpy.mockRestore();
  });
});
