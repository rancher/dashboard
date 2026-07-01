import pAndNFiltering from '@shell/plugins/steve/projectAndNamespaceFiltering.utils';

const rootGetters = ({
  inStore = 'cluster',
  showWorkspaceSwitcher = false,
  enabled = true,
  isSingleProduct = false,
} = {}) => ({
  currentProduct: {
    inStore,
    showWorkspaceSwitcher
  },
  isSingleProduct,
  'management/byId': () => ({ value: JSON.stringify({ forceNsFilterV2: { enabled } }) })
});

describe('projectAndNamespaceFiltering', () => {
  describe('isEnabled', () => {
    it('should be enabled for cluster store when setting is enabled', () => {
      expect(pAndNFiltering.isEnabled(rootGetters())).toBe(true);
    });

    it('should be disabled for non-cluster store in non-standalone mode', () => {
      expect(pAndNFiltering.isEnabled(rootGetters({ inStore: 'management' }))).toBe(false);
    });

    it('should be enabled for standalone single-product mode with non-cluster store', () => {
      expect(pAndNFiltering.isEnabled(rootGetters({
        inStore:         'management',
        isSingleProduct: true
      }))).toBe(true);
    });

    it('should be disabled when workspace switcher is shown', () => {
      expect(pAndNFiltering.isEnabled(rootGetters({
        showWorkspaceSwitcher: true,
        isSingleProduct:       true
      }))).toBe(false);
    });

    it('should be disabled when setting is not enabled', () => {
      expect(pAndNFiltering.isEnabled(rootGetters({ enabled: false }))).toBe(false);
    });
  });
});
