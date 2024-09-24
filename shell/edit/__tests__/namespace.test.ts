import { mount } from '@vue/test-utils';
import Namespace from '@shell/edit/namespace.vue';

describe('view Namespace should', () => {
  it('retrieve resource limits from project', () => {
    const name = 'my project name';
    const limits = 'whatever';
    const project = { id: name, spec: { containerDefaultResourceLimit: limits } };
    const wrapper = mount(Namespace, {
      props: {
        value: {
          metadata:     { labels: { 'field.cattle.io/projectId': name } },
          annotations:  { 'field.cattle.io/containerDefaultResourceLimit': undefined },
          listLocation: {},
        }
      },

      global: {
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
          CruResource:       { template: '<div><slot></slot></div>' }, // Required to render the slot content
          NameNsDescription: true,
          Tab:               { template: '<div><slot></slot></div>' },
          ResourceTabs:      { template: '<div><slot></slot></div>' },
        },
      },
    });

    const limitsUi = wrapper.findComponent('[data-testid="namespace-container-resource-limit"]');

    expect(limitsUi.props().value).toStrictEqual(limits);
  });
});
