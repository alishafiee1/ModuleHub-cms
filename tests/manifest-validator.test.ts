import { ManifestValidator, sanitizeModuleId } from '../core/src/modules/manifest-validator';

describe('ManifestValidator', () => {
  const validator = new ManifestValidator();

  it('rejects static manifest type at schema level', () => {
    const result = validator.validate({
      name: 'Gallery',
      type: 'static',
      version: '1.0.0',
      icon: 'g.png',
      description: 'A gallery',
    });
    expect(result.valid).toBe(false);
  });

  it('validates builtin manifest', () => {
    const result = validator.validate({
      name: 'Gallery',
      type: 'builtin',
      version: '1.0.0',
      icon: 'g.png',
      description: 'A gallery',
    });
    expect(result.valid).toBe(true);
    expect(result.moduleId).toBe('gallery');
  });

  it('rejects standalone without docker section', () => {
    const result = validator.validate({
      name: 'API',
      type: 'standalone',
      version: '1.0.0',
      icon: 'a.png',
      description: 'API',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates standalone with docker and proxy', () => {
    const compose = 'cap_drop:\n  - ALL\nread_only: true';
    const result = validator.validate(
      {
        name: 'Demo API',
        type: 'standalone',
        version: '1.0.0',
        icon: 'a.png',
        description: 'API',
        docker: { composeFile: 'docker-compose.yml', ports: [3000] },
        proxy: { prefix: '/modules/demo/', internalPort: 3000, paths: ['api'] },
      },
      compose,
    );
    expect(result.valid).toBe(true);
  });

  it('warns when cap_drop missing', () => {
    const result = validator.validate(
      {
        name: 'X',
        type: 'standalone',
        version: '1',
        icon: 'i',
        description: 'd',
        docker: { composeFile: 'docker-compose.yml', ports: [3000] },
        proxy: { prefix: '/modules/x/', internalPort: 3000 },
      },
      'services: {}',
    );
    expect(result.warnings.some((w) => w.includes('cap_drop'))).toBe(true);
  });

  it('sanitizes module id', () => {
    expect(sanitizeModuleId('Hello World!')).toBe('hello-world');
  });
});
