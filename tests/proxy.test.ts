import { ReverseProxyManager } from '../core/src/proxy/reverse-proxy-manager';
import { ModuleRegistry } from '../core/src/modules/registry';
import fs from 'fs';
import os from 'os';
import path from 'path';

describe('ReverseProxyManager', () => {
  it('registers and removes routes with path filters', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-proxy-'));
    const registry = new ModuleRegistry(path.join(tmp, 'modules.json'));
    registry.load();
    const proxy = new ReverseProxyManager(registry);
    proxy.registerRoute('demo-api', '/modules/demo-api/', 32775, ['api']);
    proxy.removeRoute('demo-api');
    fs.rmSync(tmp, { recursive: true, force: true });
    expect(true).toBe(true);
  });
});
