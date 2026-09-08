import { mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import Namespace from '@shell/edit/namespace.vue';
import CruResource from '@shell/components/CruResource.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';

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

describe('edit Namespace name validation should', () => {
  const store = {
    getters: {
      'i18n/t':               (key: string) => key,
      'management/all':       () => ([]),
      'management/schemaFor': () => false,
      currentCluster:         { id: 'local' },
      currentProduct:         jest.fn(),
      defaultNamespace:       'default',
      isStandaloneHarvester:  false
    }
  };

  // vee-validate debounces form-level schema validation, so microtasks alone
  // aren't enough to see the result.
  const settle = async() => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    await flushPromises();
  };

  const mountNamespace = async(name: string | undefined, mode = _CREATE) => {
    const wrapper = mount(Namespace, {
      props: {
        mode,
        value: {
          metadata:     { name },
          listLocation: {},
        }
      },

      global: {
        mocks: {
          $fetchState: {},
          $route:      {
            name:  'anything',
            query: {}
          },
          $router: { applyQuery: {} },
          $store:  store
        },

        provide: { store },

        stubs: {
          // Required to render the slot content, which holds the name field
          CruResource: {
            props:    ['validationPassed', 'errors'],
            template: '<div><slot></slot></div>'
          },
          ResourceTabs: true,
        },
      },
    });

    // vee-validate validates on mount, asynchronously
    await settle();

    return wrapper;
  };

  it.each([
    ['a missing name', undefined, false],
    ['an empty name', '', false],
    ['a valid name', 'my-namespace', true],
  ])('resolve form validity for %s', async(_label, name, expected) => {
    const wrapper = await mountNamespace(name);

    expect(wrapper.getComponent(CruResource).props('validationPassed')).toBe(expected);
  });

  it('become valid once a name is typed in', async() => {
    const wrapper = await mountNamespace('');

    await wrapper.find('[data-testid="NameNsDescriptionNameInput"]').setValue('my-namespace');
    await settle();

    expect(wrapper.getComponent(CruResource).props('validationPassed')).toBe(true);
  });

  it('allow saving an existing namespace in edit mode', async() => {
    const wrapper = await mountNamespace('my-namespace', _EDIT);

    expect(wrapper.getComponent(CruResource).props('validationPassed')).toBe(true);
  });

  it('keep the name error out of the generic error banner', async() => {
    const wrapper = await mountNamespace(undefined);

    expect(wrapper.getComponent(CruResource).props('errors')).toStrictEqual([]);
  });
});
