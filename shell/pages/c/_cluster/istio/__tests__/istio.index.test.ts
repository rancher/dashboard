import { nextTick } from 'vue';
import { shallowMount } from '@vue/test-utils';
import IstioOverview from '@shell/pages/c/_cluster/istio/index.vue';
import { SERVICE } from '@shell/config/types';
import Loading from '@shell/components/Loading';

const createMockService = (name: string, namespace: string, label: string, proxyUrlReturn: string) => ({
  id:       `${ namespace }/${ name }`,
  type:     'service',
  metadata: {
    name,
    namespace,
    labels: { app: label },
  },
  proxyUrl: jest.fn(() => proxyUrlReturn),
});

describe('page: IstioOverview', () => {
  const createWrapper = (overrides: Record<string, any> = {}) => {
    const mockDispatch = jest.fn();
    const mockSchemaFor = jest.fn();
    const mockResolve = jest.fn(() => ({ href: '/c/_/monitoring' }));

    const defaultMocks = {
      $fetchState: { pending: false },
      $store:      {
        dispatch: mockDispatch,
        getters:  {
          'prefs/theme':       'dark',
          'i18n/t':            (key: string) => key,
          'cluster/schemaFor': mockSchemaFor,
        },
      },
      $route:  { params: { cluster: '_' } },
      $router: { resolve: mockResolve },
    };

    const wrapper = shallowMount(IstioOverview, {
      global: {
        mocks:      { ...defaultMocks, ...(overrides.mocks || {}) },
        directives: { 'clean-html': () => {} },
        stubs:      { t: true, ...(overrides.stubs || {}) },
      },
    });

    return {
      wrapper, mockDispatch, mockSchemaFor, mockResolve
    };
  };

  describe('fetch', () => {
    it('dispatches findLabelSelector for kiali with correct label selector', async() => {
      const { wrapper, mockDispatch, mockSchemaFor } = createWrapper();

      mockSchemaFor.mockReturnValue({});
      mockDispatch.mockResolvedValue({ data: [] });

      await (IstioOverview as any).fetch.call(wrapper.vm);

      expect(mockDispatch).toHaveBeenCalledWith('cluster/findLabelSelector', {
        type:     SERVICE,
        matching: { labelSelector: { matchLabels: { app: 'kiali' } } },
        opt:      { transient: true },
      });
    });

    it('dispatches findLabelSelector for jaeger with correct label selector', async() => {
      const { wrapper, mockDispatch, mockSchemaFor } = createWrapper();

      mockSchemaFor.mockReturnValue({});
      mockDispatch.mockResolvedValue({ data: [] });

      await (IstioOverview as any).fetch.call(wrapper.vm);

      expect(mockDispatch).toHaveBeenCalledWith('cluster/findLabelSelector', {
        type:     SERVICE,
        matching: { labelSelector: { matchLabels: { app: 'jaeger' } } },
        opt:      { transient: true },
      });
    });

    it('sets kialiService and jaegerService from response data', async() => {
      const mockKiali = createMockService('kiali', 'istio-system', 'kiali', '/proxy/kiali');
      const mockJaeger = createMockService('jaeger-query', 'istio-system', 'jaeger', '/proxy/jaeger');
      const { wrapper, mockDispatch, mockSchemaFor } = createWrapper();

      mockSchemaFor.mockReturnValue({});
      mockDispatch
        .mockResolvedValueOnce({ data: [mockKiali] })
        .mockResolvedValueOnce({ data: [mockJaeger] });

      await (IstioOverview as any).fetch.call(wrapper.vm);

      expect(wrapper.vm.kialiService).toStrictEqual(mockKiali);
      expect(wrapper.vm.jaegerService).toStrictEqual(mockJaeger);
    });

    it('skips dispatches when schemaFor returns falsy', async() => {
      const { wrapper, mockDispatch, mockSchemaFor } = createWrapper();

      mockSchemaFor.mockReturnValue(null);

      await (IstioOverview as any).fetch.call(wrapper.vm);

      expect(mockDispatch).not.toHaveBeenCalledWith('cluster/findLabelSelector', expect.anything());
      expect(wrapper.vm.kialiService).toBeNull();
      expect(wrapper.vm.jaegerService).toBeNull();
    });

    it('sets services to null when response data is empty', async() => {
      const { wrapper, mockDispatch, mockSchemaFor } = createWrapper();

      mockSchemaFor.mockReturnValue({});
      mockDispatch.mockResolvedValue({ data: [] });

      await (IstioOverview as any).fetch.call(wrapper.vm);

      expect(wrapper.vm.kialiService).toBeNull();
      expect(wrapper.vm.jaegerService).toBeNull();
    });
  });

  describe('computed properties', () => {
    it('kialiUrl returns null when kialiService is null', () => {
      const { wrapper } = createWrapper();

      expect(wrapper.vm.kialiUrl).toBeNull();
    });

    it('kialiUrl calls proxyUrl with correct arguments when service exists', async() => {
      const mockKiali = createMockService('kiali', 'istio-system', 'kiali', '/proxy/kiali');
      const { wrapper } = createWrapper();

      wrapper.setData({ kialiService: mockKiali });
      await nextTick();

      expect(wrapper.vm.kialiUrl).toStrictEqual('/proxy/kiali');
      expect(mockKiali.proxyUrl).toHaveBeenCalledWith('http', '20001');
    });

    it('jaegerUrl returns null when jaegerService is null', () => {
      const { wrapper } = createWrapper();

      expect(wrapper.vm.jaegerUrl).toBeNull();
    });

    it('jaegerUrl calls proxyUrl with correct arguments and appends /jaeger/search', async() => {
      const mockJaeger = createMockService('jaeger-query', 'istio-system', 'jaeger', '/proxy/jaeger');
      const { wrapper } = createWrapper();

      wrapper.setData({ jaegerService: mockJaeger });
      await nextTick();

      expect(wrapper.vm.jaegerUrl).toStrictEqual('/proxy/jaeger/jaeger/search');
      expect(mockJaeger.proxyUrl).toHaveBeenCalledWith('http', '16686');
    });
  });

  describe('template rendering', () => {
    it('shows Loading component when fetchState is pending', () => {
      const { wrapper } = createWrapper({ mocks: { $fetchState: { pending: true } } });

      expect(wrapper.findComponent(Loading).exists()).toBe(true);
      expect(wrapper.find('.links').exists()).toBe(false);
    });

    it('shows disabled state when service URLs are null', () => {
      const { wrapper } = createWrapper();
      const containers = wrapper.findAll('.link-container');

      expect(containers).toHaveLength(2);
      containers.forEach((container) => {
        expect(container.classes()).toContain('disabled');
      });
      expect(wrapper.findAll('.disabled-msg')).toHaveLength(2);
    });

    it('hides disabled state when services are set', async() => {
      const mockKiali = createMockService('kiali', 'istio-system', 'kiali', '/proxy/kiali');
      const mockJaeger = createMockService('jaeger-query', 'istio-system', 'jaeger', '/proxy/jaeger');
      const { wrapper } = createWrapper();

      wrapper.setData({ kialiService: mockKiali, jaegerService: mockJaeger });
      await nextTick();

      const containers = wrapper.findAll('.link-container');

      containers.forEach((container) => {
        expect(container.classes()).not.toContain('disabled');
      });
      expect(wrapper.findAll('.disabled-msg')).toHaveLength(0);
    });
  });
});
