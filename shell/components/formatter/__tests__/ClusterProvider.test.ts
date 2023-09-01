import { mount } from '@vue/test-utils';
import ClusterProvider from '@shell/components/formatter/ClusterProvider.vue';

describe('component: ClusterProvider', () => {
  const importedGkeClusterInfo = { mgmt: { spec: { gkeConfig: { imported: true } } } };
  const importedAksClusterInfo = { mgmt: { spec: { aksConfig: { imported: true } } } };
  const importedEksClusterInfo = { mgmt: { spec: { eksConfig: { imported: true } } } };
  const notImportedGkeClusterInfo = { mgmt: { spec: { gkeConfig: { imported: false } } } };
  const importedClusterInfoWithProviderForEmberParam = { mgmt: { providerForEmberParam: 'import' } };

  describe('isImported', () => {
    const testCases = [
      [importedGkeClusterInfo, true],
      [importedAksClusterInfo, true],
      [importedEksClusterInfo, true],
      [notImportedGkeClusterInfo, false],
      [importedClusterInfoWithProviderForEmberParam, true],
      [{}, false],
    ];

    it.each(testCases)('should return the isImported value properly based on the props data', (row, expected) => {
      const wrapper = mount(ClusterProvider, { propsData: { row } });

      expect(wrapper.vm.$data.isImported).toBe(expected);
    }
    );
  });
});
