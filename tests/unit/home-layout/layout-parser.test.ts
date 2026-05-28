import fs from 'fs-extra';
import path from 'path';
import validFixture from '../../fixtures/site-layout-valid.json';
import invalidFixture from '../../fixtures/site-layout-invalid.json';
import { LayoutParseError, parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';

describe('layout-parser', () => {
  it('parses valid site-layout fixture', () => {
    const layout = parseSiteLayout(validFixture);

    expect(layout.version).toBe('1.0');
    expect(layout.tree.id).toBe('root');
    expect(Object.keys(layout.modules)).toEqual(['mod-1', 'mod-2']);
    expect(layout.modules['mod-1'].status).toBe('running');
  });

  it('throws on invalid JSON shape', () => {
    expect(() => parseSiteLayout(null)).toThrow(LayoutParseError);
    expect(() => parseSiteLayout({ version: '1.0' })).toThrow(LayoutParseError);
  });

  it('throws when module node references missing moduleId', () => {
    expect(() => parseSiteLayout(invalidFixture)).toThrow(LayoutParseError);
  });

  it('requires mandatory module fields', () => {
    const broken = JSON.parse(JSON.stringify(validFixture)) as typeof validFixture;
    delete (broken.modules['mod-1'] as { version?: string }).version;
    expect(() => parseSiteLayout(broken)).toThrow(LayoutParseError);
  });
});

describe('layout-parser file fixture', () => {
  it('loads docs/site-layout.json as valid layout', async () => {
    const docsPath = path.join(process.cwd(), 'docs', 'site-layout.json');
    const raw = await fs.readJson(docsPath);
    const layout = parseSiteLayout(raw);
    expect(layout.tree.type).toBe('folder');
    expect(Object.keys(layout.modules).length).toBeGreaterThan(0);
  });
});
