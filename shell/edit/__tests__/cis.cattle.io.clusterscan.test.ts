import { mount, type VueWrapper } from '@vue/test-utils';
import cisEditor from '@shell/edit/cis.cattle.io.clusterscan.vue';

describe('view: cisEditor', () => {
  let wrapper: VueWrapper<any, any>;

  beforeEach(() => {
    wrapper = mount(cisEditor, {
      props: {
        value: {
          spec:           { scanProfileName: null, canBeScheduled: () => true },
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
  });

  it('renders the component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should prevent to save', () => {
    const saveButton = wrapper.find('[data-testid="form-save"]');

    expect(saveButton.attributes().disabled).toStrictEqual('true');
  });

  describe('should allow to save', () => {
    it('given a scanProfileName', async() => {
      wrapper.setProps({
        value: {
          spec:           { scanProfileName: 'this is valid', canBeScheduled: () => true },
          canBeScheduled: () => true,
        }
      });
      await wrapper.vm.$nextTick();

      const saveButton = wrapper.find('[data-testid="form-save"]');

      expect(saveButton.attributes().disabled).toStrictEqual('false');
    });
  });
});
