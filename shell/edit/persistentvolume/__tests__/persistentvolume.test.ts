import { mount } from '@vue/test-utils';
import PersistentVolume from '@shell/edit/persistentvolume/index';
import { ExtendedVue, Vue } from 'vue/types/vue';

describe('view: PersistentVolume', () => {
  it('should list enabled PV storage option if supported', () => {
    const plugin = {
      labelKey: 'persistentVolume.csi.label', supported: true, value: 'csi'
    };
    const resource = 'PersistentVolume';
    const wrapper = mount(PersistentVolume as ExtendedVue<Vue, {}, {}, {}, PersistentVolume>, {
      props: { value: { spec: { } } },

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

    const select = wrapper.findComponent('[data-testid="persistent-volume-plugin-select"]');

    expect((select.vm as unknown as any).options).toStrictEqual(expect.arrayContaining([plugin]));
  });

  it('should select current plugin', () => {
    const plugin = 'csi';
    const resource = 'PersistentVolume';
    const wrapper = mount(PersistentVolume as ExtendedVue<Vue, {}, {}, {}, PersistentVolume>, {
      props:  { value: { spec: { [plugin]: { value: plugin } } } },
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
