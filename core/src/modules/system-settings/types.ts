/** Home page background effect mode */
export type HomePageBackgroundMode = 'none' | 'floating-icons';

/** Lucide icon theme category for floating home background */
export type HomePageIconTheme = 'nature' | 'technology' | 'tools' | 'vehicles' | 'mixed';

/** Public appearance slice exposed via GET /api/layout */
export interface HomePageAppearance {
  backgroundMode: HomePageBackgroundMode;
  iconTheme: HomePageIconTheme;
}

/** Global CMS settings persisted in storage/system-settings.json */
export interface SystemSettings {
  maxZipUploadMb: number;
  portRangeStart: number;
  portRangeEnd: number;
  defaultModuleResources: {
    cpu_limit: number;
    ram_limit_mb: number;
    swap_limit_mb: number;
    disk_iops: number;
    net_mbps: number;
  };
  maxConcurrentRunningModules: number;
  logRetentionDays: number;
  maxPackageCacheGb: number;
  dependencyInstallTimeoutSec: number;
  autoRestartOnCrash: boolean;
  autoRestartMaxAttemptsPerHour: number;
  uploadTempCleanupHours: number;
  logViewerMaxLines: number;
  sessionTtlHours: number;
  loginRateLimitPerMinute: number;
  moduleManagerSessionTtlHours: number;
  modulePasswordMaxAttempts: number;
  modulePasswordLockoutMinutes: number;
  homePageBackgroundMode: HomePageBackgroundMode;
  homePageIconTheme: HomePageIconTheme;
}
