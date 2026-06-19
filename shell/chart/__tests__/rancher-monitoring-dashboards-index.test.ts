import { shallowMount, flushPromises } from '@vue/test-utils';
import RancherMonitoringDashboards from '@shell/chart/rancher-monitoring-dashboards/index.vue';

// The component keeps a module-level Map of `chartName -> last selected
// clusterType.id` so it can restore the user's pick after a Form → YAML → Form
// remount. To stop this cache from leaking between tests we generate a unique
// chart name per test.
let chartNameCounter = 0;
const uniqueChartName = (prefix = 'chart') => `${ prefix }-${ ++chartNameCounter }`;

describe('rancher-monitoring-dashboards: index', () => {
  const createWrapper = (
    {
      provider = 'rke2',
      value = {} as Record<string, any>,
      chart,
      mode = 'create',
    }: {
      provider?: string;
      value?: Record<string, any>;
      chart?: Record<string, any>;
      mode?: string;
    } = {}
  ) => {
    return shallowMount(RancherMonitoringDashboards as any, {
      props: {
        value,
        chart: chart ?? { chartName: uniqueChartName() },
        mode,
      },
      global: {
        mocks: {
          $store: {
            getters: {
              currentCluster: { status: { provider } },
              'i18n/t':       (k: string) => k,
              t:              (k: string) => k,
            },
          },
          t: (k: string) => k,
        },
        stubs: { LabeledSelect: true },
      },
    });
  };

  describe('initial cluster type selection', () => {
    it.each([
      ['aks'],
      ['eks'],
      ['gke'],
      ['k3s'],
      ['kubeadm'],
      ['rke2'],
    ])('defaults clusterType to the provider %s', (provider) => {
      const wrapper = createWrapper({ provider });

      expect((wrapper.vm as any).clusterType.id).toBe(provider);
    });

    it('falls back to "other" when the provider does not match any cluster type', () => {
      const wrapper = createWrapper({ provider: 'unknown-provider' });

      expect((wrapper.vm as any).clusterType.id).toBe('other');
    });

    it('lowercases the provider before matching', () => {
      const wrapper = createWrapper({ provider: 'RKE2' });

      expect((wrapper.vm as any).clusterType.id).toBe('rke2');
    });
  });

  describe('applyClusterTypeValues', () => {
    it('sets k3sServer.enabled=true and etcd.enabled=false for k3s', async() => {
      const value: Record<string, any> = {};

      createWrapper({ provider: 'k3s', value });
      await flushPromises();

      expect(value.k3sServer.enabled).toBe(true);
      expect(value.etcd.enabled).toBe(false);
    });

    it.each([
      ['rke2'],
      ['eks'],
      ['kubeadm'],
      ['unknown-provider'],
    ])('sets etcd.enabled=true and k3sServer.enabled=false for non-k3s provider %s', async(provider) => {
      const value: Record<string, any> = {};

      createWrapper({ provider, value });
      await flushPromises();

      expect(value.etcd.enabled).toBe(true);
      expect(value.k3sServer.enabled).toBe(false);
    });

    it('creates the etcd and k3sServer objects when missing on value', async() => {
      const value: Record<string, any> = {};

      createWrapper({ provider: 'rke2', value });
      await flushPromises();

      expect(value.etcd).toStrictEqual({ enabled: true });
      expect(value.k3sServer).toStrictEqual({ enabled: false });
    });

    it('preserves unrelated fields on value', async() => {
      const value: Record<string, any> = {
        global: { foo: 'bar' },
        etcd:   { extraField: 'keep-me' },
      };

      createWrapper({ provider: 'k3s', value });
      await flushPromises();

      expect(value.global).toStrictEqual({ foo: 'bar' });
      expect(value.etcd.extraField).toBe('keep-me');
      expect(value.etcd.enabled).toBe(false);
    });

    it('flips values when the user changes the selection', async() => {
      const value: Record<string, any> = {};
      const wrapper = createWrapper({ provider: 'rke2', value });

      await flushPromises();
      expect(value.etcd.enabled).toBe(true);
      expect(value.k3sServer.enabled).toBe(false);

      const k3sOption = (wrapper.vm as any).clusterTypes.find((c: any) => c.id === 'k3s');

      (wrapper.vm as any).clusterType = k3sOption;
      await flushPromises();

      expect(value.etcd.enabled).toBe(false);
      expect(value.k3sServer.enabled).toBe(true);
    });
  });

  describe('watch: clusterType', () => {
    it('ignores empty cluster type and does not mutate value', async() => {
      const value: Record<string, any> = {};
      const wrapper = createWrapper({ provider: 'rke2', value });

      await flushPromises();

      const snapshot = JSON.stringify(value);

      (wrapper.vm as any).clusterType = null;
      await flushPromises();

      expect(JSON.stringify(value)).toBe(snapshot);
    });
  });

  describe('cached selection across remounts', () => {
    it('restores the last user selection when the same chart remounts', async() => {
      const chart = { chartName: uniqueChartName('same-chart') };

      const first = createWrapper({ provider: 'rke2', value: {}, chart });

      await flushPromises();
      expect((first.vm as any).clusterType.id).toBe('rke2');

      const k3sOption = (first.vm as any).clusterTypes.find((c: any) => c.id === 'k3s');

      (first.vm as any).clusterType = k3sOption;
      await flushPromises();
      first.unmount();

      // Simulate a remount on the same chart (e.g. user toggled to YAML and back).
      const second = createWrapper({
        provider: 'rke2',
        value:    { etcd: { enabled: false }, k3sServer: { enabled: true } },
        chart,
      });

      expect((second.vm as any).clusterType.id).toBe('k3s');
    });

    it('preserves a non-k3s selection across remounts (the case value-derivation alone cannot recover)', async() => {
      const chart = { chartName: uniqueChartName('non-k3s-pick') };

      const first = createWrapper({ provider: 'k3s', value: {}, chart });

      await flushPromises();
      expect((first.vm as any).clusterType.id).toBe('k3s');

      const rke2Option = (first.vm as any).clusterTypes.find((c: any) => c.id === 'rke2');

      (first.vm as any).clusterType = rke2Option;
      await flushPromises();
      first.unmount();

      // Both rke2 and the k3s-provider default would write the same value
      // object, so derivation from `value` alone cannot tell them apart — the
      // module-level cache is the only thing that keeps "rke2" here.
      const second = createWrapper({
        provider: 'k3s',
        value:    { etcd: { enabled: true }, k3sServer: { enabled: false } },
        chart,
      });

      expect((second.vm as any).clusterType.id).toBe('rke2');
    });

    it('does not leak a selection across different chart names', async() => {
      const first = createWrapper({
        provider: 'rke2',
        value:    {},
        chart:    { chartName: uniqueChartName('chart-a') },
      });

      await flushPromises();

      const k3sOption = (first.vm as any).clusterTypes.find((c: any) => c.id === 'k3s');

      (first.vm as any).clusterType = k3sOption;
      await flushPromises();
      first.unmount();

      const second = createWrapper({
        provider: 'rke2',
        value:    {},
        chart:    { chartName: uniqueChartName('chart-b') },
      });

      // Different cache key, so chart-b should still default from its provider.
      expect((second.vm as any).clusterType.id).toBe('rke2');
    });

    it('uses chart.name as the cache key when chartName is absent', async() => {
      const chart = { name: uniqueChartName('fallback-name') };

      const first = createWrapper({ provider: 'rke2', value: {}, chart });

      await flushPromises();

      const k3sOption = (first.vm as any).clusterTypes.find((c: any) => c.id === 'k3s');

      (first.vm as any).clusterType = k3sOption;
      await flushPromises();
      first.unmount();

      const second = createWrapper({ provider: 'rke2', value: {}, chart });

      expect((second.vm as any).clusterType.id).toBe('k3s');
    });
  });

  describe('clusterTypes data', () => {
    it('sorts cluster types by id for the dropdown', () => {
      const wrapper = createWrapper();
      const ids = (wrapper.vm as any).clusterTypes.map((c: any) => c.id);

      expect(ids).toStrictEqual([...ids].sort());
    });
  });
});
