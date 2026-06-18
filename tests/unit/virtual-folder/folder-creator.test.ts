import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';
import { createVirtualFolder } from '../../../core/src/modules/virtual-folder';
import validFixture from '../../fixtures/site-layout-valid.json';

describe('folder-creator', () => {
  it('adds virtual folder to layout without creating disk directory', async () => {
    const layout = parseSiteLayout(validFixture);
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-vfolder-'));
    const standaloneBefore = await fs.readdir(tempRoot).catch(() => []);

    const result = createVirtualFolder(layout, { parentId: 'root', name: 'پوشه تست' });

    expect(result.node.type).toBe('folder');
    expect(result.node.name).toBe('پوشه تست');
    expect(result.node.cardGrid?.colSpan).toBe(5);
    expect(result.node.cardGrid?.rowSpan).toBe(5);
    const parent = result.layout.tree.children?.find((child) => child.id === result.folderId);
    expect(parent).toBeDefined();

    const standaloneAfter = await fs.readdir(tempRoot).catch(() => []);
    expect(standaloneAfter.length).toBe(standaloneBefore.length);

    await fs.remove(tempRoot);
  });

  it('rejects empty folder name', () => {
    const layout = parseSiteLayout(validFixture);
    expect(() => createVirtualFolder(layout, { parentId: 'root', name: '   ' })).toThrow(/required/);
  });

  it('rejects duplicate folder names under the same parent', () => {
    const layout = parseSiteLayout(validFixture);
    createVirtualFolder(layout, { parentId: 'root', name: 'Duplicate' });

    expect(() => createVirtualFolder(layout, { parentId: 'root', name: 'Duplicate' })).toThrow(/already exists/);
  });
});
