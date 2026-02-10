import { mount, RouterLinkStub } from '@vue/test-utils';
import KubeconfigClusters from '@shell/components/formatter/KubeconfigClusters.vue';

describe('component: KubeconfigClusters', () => {
  const MAX_DISPLAY = 25;

  const createCluster = (label: string, hasLocation = true) => ({
    label,
    location: hasLocation ? { name: 'cluster-detail', params: { cluster: label } } : null
  });

  const createClusters = (count: number, hasLocation = true) => {
    return Array.from({ length: count }, (_, i) => createCluster(`cluster-${ i + 1 }`, hasLocation));
  };

  const defaultMocks = { t: (key: string, args: Record<string, unknown>) => `+ ${ args.remainingCount } more` };

  const mountComponent = (clusters: unknown[] = [], mocks = defaultMocks) => {
    return mount(KubeconfigClusters, {
      props:  { row: { id: 'test-row', sortedReferencedClusters: clusters } },
      global: {
        mocks,
        stubs: { 'router-link': RouterLinkStub }
      }
    });
  };

  describe('displaying clusters', () => {
    it('should display a dash when there are no clusters', () => {
      const wrapper = mountComponent([]);
      const emptySpan = wrapper.find('.text-muted');

      expect(emptySpan.text()).toBe('—');
    });

    it('should display cluster labels with router-links when clusters have locations', () => {
      const clusters = [createCluster('local'), createCluster('downstream')];
      const wrapper = mountComponent(clusters);
      const links = wrapper.findAllComponents(RouterLinkStub);

      expect(links).toHaveLength(2);
      expect(links[0].text()).toBe('local');
      expect(links[1].text()).toBe('downstream');
    });

    it('should display cluster labels as text-muted spans when clusters have no location', () => {
      const clusters = [createCluster('deleted-cluster', false)];
      const wrapper = mountComponent(clusters);
      const mutedSpan = wrapper.find('.text-muted');

      expect(mutedSpan.text()).toBe('deleted-cluster');
      expect(wrapper.findComponent(RouterLinkStub).exists()).toBe(false);
    });

    it('should separate clusters with commas', () => {
      const clusters = [createCluster('cluster-1'), createCluster('cluster-2')];
      const wrapper = mountComponent(clusters);

      expect(wrapper.text()).toContain(',');
    });
  });

  describe('max display limit', () => {
    it('should display all clusters when count is at or below the limit', () => {
      const clusters = createClusters(MAX_DISPLAY);
      const wrapper = mountComponent(clusters);
      const links = wrapper.findAllComponents(RouterLinkStub);

      expect(links).toHaveLength(MAX_DISPLAY);
      expect(wrapper.text()).not.toContain('more');
    });

    it('should limit displayed clusters to MAX_DISPLAY', () => {
      const clusters = createClusters(MAX_DISPLAY + 10);
      const wrapper = mountComponent(clusters);
      const links = wrapper.findAllComponents(RouterLinkStub);

      expect(links).toHaveLength(MAX_DISPLAY);
    });

    it('should show remaining count when clusters exceed the limit', () => {
      const totalClusters = MAX_DISPLAY + 5;
      const clusters = createClusters(totalClusters);
      const wrapper = mountComponent(clusters);

      expect(wrapper.text()).toContain('+ 5 more');
    });

    it('should show correct remaining count for large cluster lists', () => {
      const totalClusters = MAX_DISPLAY + 100;
      const clusters = createClusters(totalClusters);
      const wrapper = mountComponent(clusters);

      expect(wrapper.text()).toContain('+ 100 more');
    });
  });

  describe('computed properties', () => {
    it('should return empty array for allClusters when row has no sortedReferencedClusters', () => {
      const wrapper = mount(KubeconfigClusters, {
        props:  { row: { id: 'test-row' } },
        global: {
          mocks: defaultMocks,
          stubs: { 'router-link': RouterLinkStub }
        }
      });

      expect(wrapper.vm.allClusters).toStrictEqual([]);
    });

    it('should calculate remainingCount as 0 when clusters are at or below limit', () => {
      const clusters = createClusters(MAX_DISPLAY);
      const wrapper = mountComponent(clusters);

      expect(wrapper.vm.remainingCount).toBe(0);
    });

    it('should calculate correct remainingCount when clusters exceed limit', () => {
      const clusters = createClusters(MAX_DISPLAY + 15);
      const wrapper = mountComponent(clusters);

      expect(wrapper.vm.remainingCount).toBe(15);
    });
  });
});
