import { DEFAULT_SYSTEM_SETTINGS } from '../../../core/src/modules/system-settings/settings-loader';
import { mergeSystemSettings } from '../../../core/src/modules/system-settings/settings-merge';

describe('system-settings settings-merge', () => {
  it('merges partial top-level fields into defaults', () => {
    const merged = mergeSystemSettings(DEFAULT_SYSTEM_SETTINGS, {
      maxZipUploadMb: 100,
      sessionTtlHours: 4,
    });

    expect(merged.maxZipUploadMb).toBe(100);
    expect(merged.sessionTtlHours).toBe(4);
    expect(merged.portRangeStart).toBe(DEFAULT_SYSTEM_SETTINGS.portRangeStart);
  });

  it('deep-merges defaultModuleResources without dropping sibling keys', () => {
    const merged = mergeSystemSettings(DEFAULT_SYSTEM_SETTINGS, {
      defaultModuleResources: {
        ...DEFAULT_SYSTEM_SETTINGS.defaultModuleResources,
        ram_limit_mb: 1024,
      },
    });

    expect(merged.defaultModuleResources.ram_limit_mb).toBe(1024);
    expect(merged.defaultModuleResources.cpu_limit).toBe(
      DEFAULT_SYSTEM_SETTINGS.defaultModuleResources.cpu_limit,
    );
    expect(merged.defaultModuleResources.net_mbps).toBe(
      DEFAULT_SYSTEM_SETTINGS.defaultModuleResources.net_mbps,
    );
  });

  it('overrides base document when saving partial updates on top of current file', () => {
    const current = {
      ...DEFAULT_SYSTEM_SETTINGS,
      maxConcurrentRunningModules: 7,
    };
    const merged = mergeSystemSettings(current, {
      maxConcurrentRunningModules: 5,
      loginRateLimitPerMinute: 10,
    });

    expect(merged.maxConcurrentRunningModules).toBe(5);
    expect(merged.loginRateLimitPerMinute).toBe(10);
    expect(merged.maxZipUploadMb).toBe(DEFAULT_SYSTEM_SETTINGS.maxZipUploadMb);
  });
});
