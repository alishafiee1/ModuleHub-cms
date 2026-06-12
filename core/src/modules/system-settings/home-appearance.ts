import type { HomePageAppearance, SystemSettings } from './types';

/**
 * Maps persisted system settings to public home page appearance.
 * @param settings - Validated system settings
 * @returns Appearance payload for GET /api/layout
 */
export function toHomePageAppearance(settings: SystemSettings): HomePageAppearance {
  return {
    backgroundMode: settings.homePageBackgroundMode,
    iconTheme: settings.homePageIconTheme,
  };
}
