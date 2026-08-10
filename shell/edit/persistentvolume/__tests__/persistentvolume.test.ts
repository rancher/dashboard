import { mount } from '@vue/test-utils';
import PersistentVolume from '@shell/edit/persistentvolume/index.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

describe('view: PersistentVolume', () => {
  it('should list enabled PV storage option if supported', () => {
    const plugin = {
      labelKey: 'persistentVolume.csi.label', supported: true, value: 'csi'
    };
    const resource = 'PersistentVolume';
    const wrapper = mount(PersistentVolume, {
      props: {
        value: {
          setAnnotation: jest.fn(),
          spec:          {},
          metadata:      {},
        }
      },

      global: {
        mocks: {
          $store: {
            dispatch: () => jest.fn(),
            getters:  {
              'i18n/t':            jest.fn(),
              'i18n/exists':       jest.fn(),
              currentStore:        () => 'cluster',
              'features/get':      () => jest.fn(),
              'prefs/get':         () => resource,
              'cluster/schemaFor': () => {},
              'cluster/all':       () => [{}],
            }
          },
          $fetchState: {
            pending: false, error: true, timestamp: Date.now()
          },
          $route: {
            params: { resource },
            query:  { AS: '' },
            hash:   '',
          },
          $router: {
            currentRoute: {},
            replace:      jest.fn(),
          }
        },

        stubs: {
          LabeledSelect: true, Tabbed: true, Tab: true
        },
      },
    });

    const select = wrapper.findComponent<typeof LabeledSelect>('[data-testid="persistent-volume-plugin-select"]');

    expect(select.props('options')).toStrictEqual(expect.arrayContaining([plugin]));
  });

  it('should select current plugin', () => {
    const plugin = 'csi';
    const resource = 'PersistentVolume';
    const wrapper = mount(PersistentVolume, {
      props: {
        value: {
          setAnnotation: jest.fn(),
          spec:          { [plugin]: { value: plugin } },
          metadata:      {},
        }
      },
      global: {
        mocks: {
          $store: {
            dispatch: () => jest.fn(),
            getters:  {
              'i18n/t':            jest.fn(),
              'i18n/exists':       jest.fn(),
              currentStore:        () => 'cluster',
              'features/get':      () => jest.fn(),
              'prefs/get':         () => resource,
              'cluster/schemaFor': () => {},
              'cluster/all':       () => [{}],
            }
          },
          $fetchState: {
            pending: false, error: true, timestamp: Date.now()
          },
          $route: {
            params: { resource },
            query:  { AS: '' },
            hash:   '',
          },
          $router: {
            currentRoute: {},
            replace:      jest.fn(),
          },
        },
        stubs: {
          LabeledSelect: true, Tabbed: true, Tab: true
        },
      }
    });

    expect(wrapper.vm.plugin).toBe(plugin);
  });
});
