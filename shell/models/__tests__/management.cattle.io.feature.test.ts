import Feature from '@shell/models/management.cattle.io.feature.js';
import Resource from '@shell/plugins/dashboard-store/resource-class';

describe('class Feature', () => {
  const ctx = {
    dispatch:    jest.fn(),
    rootGetters: { 'i18n/t': (key: string) => key },
    getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
  };

  // The parent Resource._availableActions getter depends on runtime config we don't have
  // in tests — stub it out so we can assert on Feature's own additions.
  beforeEach(() => {
    jest.spyOn(Resource.prototype, '_availableActions', 'get').mockReturnValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('enabled getter', () => {
    it.each([
      [true, true],
      [false, false],
    ])('should return lockedValue (%s) when status.lockedValue is not null', (lockedValue, expected) => {
      const feature = new Feature({
        spec:   { value: false },
        status: { lockedValue, default: false }
      }, ctx);

      expect(feature.enabled).toBe(expected);
    });

    it('should return spec.value when lockedValue is null and spec.value is set', () => {
      const feature = new Feature({
        spec:   { value: true },
        status: { lockedValue: null, default: false }
      }, ctx);

      expect(feature.enabled).toBe(true);
    });

    it('should fall back to status.default when lockedValue is null and spec.value is null', () => {
      const feature = new Feature({
        spec:   { value: null },
        status: { lockedValue: null, default: true }
      }, ctx);

      expect(feature.enabled).toBe(true);
    });

    it('should not throw when status is missing (malformed feature flag)', () => {
      const feature = new Feature({ spec: { value: true } }, ctx);

      expect(() => feature.enabled).not.toThrow();
      expect(feature.enabled).toBe(true);
    });
  });

  describe('restartRequired getter', () => {
    it('should return false when status.dynamic is true', () => {
      const feature = new Feature({ spec: {}, status: { dynamic: true, lockedValue: null } }, ctx);

      expect(feature.restartRequired).toBe(false);
    });

    it('should return true when status.dynamic is false', () => {
      const feature = new Feature({ spec: {}, status: { dynamic: false, lockedValue: null } }, ctx);

      expect(feature.restartRequired).toBe(true);
    });

    it('should return true when status is missing (malformed feature flag)', () => {
      const feature = new Feature({ spec: {} }, ctx);

      expect(() => feature.restartRequired).not.toThrow();
      expect(feature.restartRequired).toBe(true);
    });
  });

  describe('_availableActions getter', () => {
    it('should disable the toggle action when lockedValue is not null', () => {
      const feature = new Feature({
        spec:   { value: false },
        status: {
          lockedValue: true, default: false, dynamic: true
        },
      }, ctx);

      jest.spyOn(feature, 'canUpdate', 'get').mockReturnValue(true);

      const actions = feature._availableActions;

      expect(actions[0].action).toBe('toggleFeatureFlag');
      expect(actions[0].enabled).toBe(false);
    });

    it('should enable the toggle action when lockedValue is null and user canUpdate', () => {
      const feature = new Feature({
        spec:   { value: false },
        status: {
          lockedValue: null, default: false, dynamic: true
        },
        id: 'some-feature',
      }, ctx);

      jest.spyOn(feature, 'canUpdate', 'get').mockReturnValue(true);

      const actions = feature._availableActions;

      expect(actions[0].action).toBe('toggleFeatureFlag');
      expect(actions[0].enabled).toBe(true);
    });

    it('should not throw and should disable the toggle action when status is missing (malformed feature flag)', () => {
      const feature = new Feature({
        spec: { value: false },
        id:   'some-feature',
      }, ctx);

      jest.spyOn(feature, 'canUpdate', 'get').mockReturnValue(true);

      expect(() => feature._availableActions).not.toThrow();

      const actions = feature._availableActions;

      expect(actions[0].action).toBe('toggleFeatureFlag');
      expect(actions[0].enabled).toBeFalsy();
    });
  });
});
