import { mount, type VueWrapper } from '@vue/test-utils';
import cisEditor from '@shell/edit/cis.cattle.io.clusterscan.vue';

describe('view: cisEditor', () => {
  it('renders the component', () => {
    const wrapper: VueWrapper<any, any> = mount(cisEditor, {
      props: {
        value: {
          spec:           { scanProfileName: 'whatever' },
          canBeScheduled: () => true,
        }
      },
      global: {
        mocks: {
          $fetchState: { pending: false },
          $route:      {
            name:  'whatever',
            query: { AS: 'whatever' },
          },
          $store: {
            getters: {
              'i18n/t':             () => 'whatever',
              currentStore:         () => 'whatever',
              'whatever/schemaFor': jest.fn(),
            },
            dispatch: jest.fn(),
          },
        },
        stubs: { AsyncButton: true }
      }
    });

    expect(wrapper.exists()).toBe(true);
  });
});
