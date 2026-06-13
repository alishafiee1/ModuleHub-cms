import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import validFixture from '../../fixtures/site-layout-valid.json';
import { parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';
import { migrateSiteLayoutCardGrid } from '../../../core/src/modules/home-layout/migrate-card-grid';

describe('readSiteLayoutWithMeta derive', () => {
  let tempRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-layout-store-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    await fs.ensureDir(path.join(tempRoot, 'storage'));
    jest.resetModules();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    await fs.remove(tempRoot);
  });

  it('is idempotent — second read does not set derivedLayoutsSaved', async () => {
    const base = migrateSiteLayoutCardGrid(parseSiteLayout(validFixture)).layout;
    await fs.writeJson(path.join(tempRoot, 'storage', 'site-layout.json'), base);

    const { readSiteLayoutWithMeta: readFirst } = await import(
      '../../../core/src/modules/home-layout/layout-store'
    );
    const first = await readFirst();
    expect(first.derivedLayoutsSaved).toBe(true);

    const { readSiteLayoutWithMeta: readSecond } = await import(
      '../../../core/src/modules/home-layout/layout-store'
    );
    const second = await readSecond();
    expect(second.derivedLayoutsSaved).toBe(false);
  });
});
