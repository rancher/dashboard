import { isAdminUser } from '@shell/store/type-map';
import { CATALOG, MANAGEMENT } from '@shell/config/types';

const ADMIN_TYPES = [
  MANAGEMENT.SETTING,
  MANAGEMENT.FEATURE,
  CATALOG.APP,
  CATALOG.CLUSTER_REPO,
  CATALOG.OPERATION,
];

/**
 * Builds a `management/schemaFor` getter that reports PUT on every type in `writable`.
 *
 * `throwWhenUnloaded` reproduces the real getter's behaviour: when no schemas are loaded it
 * throws unless the caller opts out via the third argument (`allowThrow`).
 */
const makeGetters = ({ writable = ADMIN_TYPES, throwWhenUnloaded = false } = {}) => ({
  'management/schemaFor': jest.fn((type: string, _fuzzy = false, allowThrow = true) => {
    if (throwWhenUnloaded) {
      if (allowThrow) {
        throw new Error("Schemas aren't loaded yet");
      }

      return null;
    }

    return writable.includes(type) ? { resourceMethods: ['GET', 'PUT'] } : { resourceMethods: ['GET'] };
  }),
});

describe('fx: isAdminUser', () => {
  it('should return true when every admin type is writable', () => {
    expect(isAdminUser(makeGetters())).toBe(true);
  });

  it.each(ADMIN_TYPES)('should return false when %s is not writable', (type) => {
    const writable = ADMIN_TYPES.filter((t) => t !== type);

    expect(isAdminUser(makeGetters({ writable }))).toBe(false);
  });

  it('should return false when no types are writable', () => {
    expect(isAdminUser(makeGetters({ writable: [] }))).toBe(false);
  });

  /**
   * Regression: the optional chaining on the result cannot guard against the getter itself
   * throwing, so `isAdminUser` has to ask for a non-throwing lookup. Extensions call this during
   * early navigation, before the management store has schemas, and an uncaught throw here takes
   * down the whole UI.
   */
  it('should return false rather than throw when schemas are not loaded yet', () => {
    const getters = makeGetters({ throwWhenUnloaded: true });

    expect(() => isAdminUser(getters)).not.toThrow();
    expect(isAdminUser(getters)).toBe(false);
  });

  it('should request a non-throwing lookup for every admin type', () => {
    const getters = makeGetters();

    isAdminUser(getters);

    ADMIN_TYPES.forEach((type) => {
      expect(getters['management/schemaFor']).toHaveBeenCalledWith(type, false, false);
    });
  });
});
