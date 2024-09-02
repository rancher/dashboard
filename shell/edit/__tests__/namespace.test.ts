import { mount } from '@vue/test-utils';
import Namespace from '@shell/edit/namespace.vue';
import { DefaultProps } from 'vue/types/options';
import { ExtendedVue, Vue } from 'vue/types/vue';

describe('view Namespace should', () => {
  it('retrieve resource limits from project', () => {
    const name = 'my project name';
    const limits = 'whatever';
    const project = { id: name, spec: { containerDefaultResourceLimit: limits } };
    const wrapper = mount(Namespace as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: {
        value: {
          metadata:     { labels: { 'field.cattle.io/projectId': name } },
          annotations:  { 'field.cattle.io/containerDefaultResourceLimit': undefined },
          listLocation: {},
        }
      },
      mocks: {
        $fetchState: {},
        $route:      {
          name:  'anything',
          query: { AS: 'yaml' }
        },
        $router: { applyQuery: {} },
        $store:  {
          getters: {
            'i18n/t':              jest.fn(),
            'management/all':      () => ([project]),
            currentProduct:        jest.fn(),
            isStandaloneHarvester: false
          }
        }
      },
      stubs: {
        CruResource:            { template: '<div><slot></slot></div>' }, // Required to render the slot content
        ContainerResourceLimit: { template: '<div data-testid="limits"></div>' }, // Ensure value to be added to component
        NameNsDescription:      true,
        Tab:                    true,
        ResourceTabs:           true
      }
    });

    const limitsUi = wrapper.find('[data-testid="limits"]');

    expect(limitsUi.vm.$attrs.value).toStrictEqual(limits);
  });
});
