import { DEFAULT_SYSTEM_SETTINGS } from '../../../core/src/modules/system-settings/settings-loader';
import {
  assertValidSystemSettings,
  validateSystemSettingsSchema,
} from '../../../core/src/modules/system-settings/schema-validator';
import exampleSettings from '../../../docs/system-settings.example.json';

describe('system-settings schema-validator', () => {
  it('accepts docs/system-settings.example.json as valid', () => {
    const result = validateSystemSettingsSchema(exampleSettings);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts DEFAULT_SYSTEM_SETTINGS as valid', () => {
    const result = validateSystemSettingsSchema(DEFAULT_SYSTEM_SETTINGS);
    expect(result.valid).toBe(true);
  });

  it('rejects invalid port range when start >= end', () => {
    const result = validateSystemSettingsSchema({
      ...DEFAULT_SYSTEM_SETTINGS,
      portRangeStart: 5000,
      portRangeEnd: 4100,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((message) => message.includes('portRangeStart'))).toBe(true);
  });

  it('rejects missing defaultModuleResources fields', () => {
    const result = validateSystemSettingsSchema({
      ...DEFAULT_SYSTEM_SETTINGS,
      defaultModuleResources: { cpu_limit: 0.01 },
    });
    expect(result.valid).toBe(false);
  });

  it('throws on assertValidSystemSettings for invalid maxZipUploadMb', () => {
    expect(() => assertValidSystemSettings({
      ...DEFAULT_SYSTEM_SETTINGS,
      maxZipUploadMb: 0,
    })).toThrow(/maxZipUploadMb/);
  });
});
