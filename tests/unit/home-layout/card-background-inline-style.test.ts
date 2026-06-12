import { buildCardBackgroundInlineStyle } from '../../../core/src/modules/home-layout/card-background-inline-style';

describe('buildCardBackgroundInlineStyle', () => {
  it('returns empty string for missing or none background', () => {
    expect(buildCardBackgroundInlineStyle(undefined)).toBe('');
    expect(buildCardBackgroundInlineStyle(null)).toBe('');
    expect(buildCardBackgroundInlineStyle({ type: 'none' })).toBe('');
  });

  it('builds color variables', () => {
    const style = buildCardBackgroundInlineStyle({
      type: 'color',
      color: '#3b82f6',
      backgroundOpacity: 80,
      overlayOpacity: 30,
    });
    expect(style).toContain('--card-bg-color:#3b82f6');
    expect(style).toContain('--card-bg-opacity:0.8');
    expect(style).toContain('--card-overlay-opacity:0.3');
  });

  it('uses single quotes in url() so HTML style attributes stay valid', () => {
    const imageUrl = '/card-backgrounds/abc.webp';
    const style = buildCardBackgroundInlineStyle({
      type: 'image',
      imageUrl,
      backgroundOpacity: 100,
      overlayOpacity: 45,
    });

    expect(style).toContain(`url('${imageUrl}')`);
    expect(style).not.toContain(`url("${imageUrl}")`);

    const html = `<div style="${style}"></div>`;
    expect(html).toContain(imageUrl);
    expect(html.match(/style="[^"]*"/)?.[0]).toContain(imageUrl);
  });
});
