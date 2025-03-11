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
              'i18n/t':             (text: string) => text,
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

  describe('should prevent to save', () => {
    it('given no Profile name', () => {
      const saveButton = wrapper.find('[data-testid="form-save"]');

      expect(saveButton.attributes().disabled).toStrictEqual('true');
    });

    it('given a wrong schedule format', async() => {
      wrapper.vm.value.spec.scanProfileName = 'this is valid';
      wrapper.vm.value.spec.scheduledScanConfig = { cronSchedule: 'this is not', scanAlertRule: { } };
      wrapper.vm.isScheduled = true; // Not assigned by fetch()
      wrapper.vm.scheduledScanConfig = { cronSchedule: 'this is not', scanAlertRule: { } }; // Not assigned by fetch()
      wrapper.vm.scanAlertRule = {}; // Not assigned by fetch()
      await wrapper.vm.$nextTick();

      const saveButton = wrapper.find('[data-testid="form-save"]');

      expect(saveButton.attributes().disabled).toStrictEqual('true');
    });
  });

  describe('should allow to save', () => {
    it('given a scanProfileName', async() => {
      wrapper.vm.value.spec.scanProfileName = 'this is valid';
      await wrapper.vm.$nextTick();

      const saveButton = wrapper.find('[data-testid="form-save"]');

      expect(saveButton.attributes().disabled).toStrictEqual('false');
    });

    it.each([
      '0 * * * *',
      '@daily'
    ])('given a scanProfileName and a schedule %p', async(cronSchedule) => {
      wrapper.vm.value.spec.scanProfileName = 'this is valid';
      wrapper.vm.value.spec.scheduledScanConfig = { cronSchedule, scanAlertRule: { } };
      wrapper.vm.scheduledScanConfig = { cronSchedule, scanAlertRule: {} }; // Not assigned by fetch()
      wrapper.vm.scanAlertRule = {}; // Not assigned by fetch()
      wrapper.vm.isScheduled = true; // Not assigned by fetch()
      await wrapper.vm.$nextTick();

      const saveButton = wrapper.find('[data-testid="form-save"]');

      expect(saveButton.attributes().disabled).toStrictEqual('false');
    });
  });
});
