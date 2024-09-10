import { nextTick } from 'vue';
import { shallowMount } from '@vue/test-utils';

import IconMessage from '@shell/components/IconMessage';
import LonghornOverview from '@shell/pages/c/_cluster/longhorn/index.vue';

const longhornFrontend = {
  id:         'default/longhorn-frontend',
  type:       'service',
  apiVersion: 'v1',
  kind:       'Service',
  metadata:   {
    labels:    { app: 'longhorn-ui' },
    name:      'longhorn-frontend',
    namespace: 'default',
  }
};

describe('page: LonghornOverview', () => {
  const commonMocks = {
    $fetchState: { pending: false },
    $store:      {
      dispatch: () => jest.fn,
      getters:  {
        currentCluster:      { id: '_' },
        currentProduct:      () => 'cluster',
        'cluster/findAll':   () => jest.fn(),
        'cluster/schemaFor': () => jest.fn(),
        'cluster/matching':  () => jest.fn(),
        'i18n/t':            () => jest.fn(),
      },
    },
    $route: { params: { cluster: '_' } }
  };

  const createWrapper = (overrides?: any) => {
    return shallowMount(LonghornOverview, {
      ...overrides,

      global: { mocks: commonMocks },
    });
  };

  it('initializes externalLinks as an empty array', () => {
    const wrapper = createWrapper({
      stubs: {
        IconMessage: { template: '<span />' },
        LazyImage:   { template: '<span />' },
      }
    });

    expect(wrapper.vm.externalLinks).toStrictEqual([]);
  });

  it('populates externalLinks proxy link correctly when uiServices contain service', async() => {
    const proxyUrl = `/k8s/clusters/_/api/v1/namespaces/${ longhornFrontend.metadata.namespace }/services/http:longhorn-frontend:80/proxy/`;

    interface LinkConfig {
      enabled: boolean;
      iconSrc: string;
      label: string;
      description: string;
      link: string;
    }

    const wrapper = createWrapper({
      stubs: {
        Banner:    { template: '<span />' },
        LazyImage: { template: '<span />' },
      }
    });

    wrapper.setData({ uiServices: [longhornFrontend] });

    await nextTick();

    const containsProxyUrl = wrapper.vm.externalLinks.find((link: LinkConfig) => link.link);

    expect(containsProxyUrl).toBeTruthy();
    expect(containsProxyUrl.link).toStrictEqual(proxyUrl);
  });

  it('displays IconMessage when externalLinks array is empty', () => {
    const wrapper = createWrapper({ stubs: { LazyImage: { template: '<span />' } } });

    expect(wrapper.vm.externalLinks).toStrictEqual([]);

    const iconMessage = wrapper.findComponent(IconMessage);

    expect(iconMessage.exists()).toBe(true);
  });
});
