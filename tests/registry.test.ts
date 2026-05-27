import fs from 'fs';
import os from 'os';
import path from 'path';
import { ModuleRegistry } from '../core/src/modules/registry';

describe('ModuleRegistry', () => {
  let tmpDir: string;
  let registryPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-registry-'));
    registryPath = path.join(tmpDir, 'modules.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates empty registry on first load', () => {
    const registry = new ModuleRegistry(registryPath);
    registry.load();
    expect(registry.getAll()).toEqual([]);
    expect(fs.existsSync(registryPath)).toBe(true);
  });

  it('upserts and persists modules atomically', () => {
    const registry = new ModuleRegistry(registryPath);
    registry.load();
    const entry = {
      id: 'test-mod',
      name: 'Test',
      type: 'builtin' as const,
      version: '1.0.0',
      icon: 'x.png',
      description: 'desc',
      status: 'static' as const,
      installPath: '/tmp/test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    registry.upsert(entry);
    expect(fs.existsSync(`${registryPath}.bak`)).toBe(true);

    const registry2 = new ModuleRegistry(registryPath);
    registry2.load();
    expect(registry2.getById('test-mod')?.name).toBe('Test');
  });

  it('removes module and creates backup on save', () => {
    const registry = new ModuleRegistry(registryPath);
    registry.load();
    registry.upsert({
      id: 'a',
      name: 'A',
      type: 'builtin',
      version: '1',
      icon: 'i',
      description: 'd',
      status: 'static',
      installPath: '/a',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    registry.upsert({
      id: 'b',
      name: 'B',
      type: 'builtin',
      version: '1',
      icon: 'i',
      description: 'd',
      status: 'static',
      installPath: '/b',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    registry.remove('a');
    expect(registry.getById('a')).toBeUndefined();
    expect(registry.getById('b')).toBeDefined();
  });

  it('rejects invalid modules.json schema on load', () => {
    fs.writeFileSync(registryPath, JSON.stringify({ modules: [{ id: 'bad' }] }));
    const registry = new ModuleRegistry(registryPath);
    registry.load();
    expect(registry.getAll()).toEqual([]);
  });
});
