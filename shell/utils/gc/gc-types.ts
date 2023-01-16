export type GC_PREFERENCES = {
  enabled: boolean,
  enabledInterval: boolean,
  interval: number,
  enabledOnNavigate: boolean,
  ageThreshold: number,
  countThreshold: number
}

export const GC_DEFAULTS: GC_PREFERENCES = {
  enabled: false,

  // When GC Runs
  enabledInterval:   true,
  interval:          1 * 60 * 5,
  enabledOnNavigate: true,

  // How GC handles resources when GC'ing
  ageThreshold:   1 * 60 * 2,
  countThreshold: 500,
};
