import { mount, type VueWrapper } from '@vue/test-utils';
import complianceEditor from '@shell/edit/compliance.cattle.io.clusterscan.vue';
import { RadioGroup } from '@components/Form/Radio';

describe('view: complianceEditor', () => {
  let wrapper: VueWrapper<any, any>;

  beforeEach(() => {
    wrapper = mount(complianceEditor, {
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

  describe('in view mode', () => {
    it.each([
      ['has not run yet', undefined],
      ['has a report', { summary: { warn: 0 } }],
    ])('shows the schedule of a scheduled scan that %s', async(_, status) => {
      const scheduledScanConfig = { cronSchedule: '0 2 * * *', scanAlertRule: {} };
      const viewWrapper: VueWrapper<any, any> = mount(complianceEditor, {
        props: {
          mode:  'view',
          value: {
            spec:           { scanProfileName: 'profile', scheduledScanConfig },
            status,
            canBeScheduled: () => true,
          }
        },
        global: {
          mocks: {
            $fetchState: { pending: false },
            $route:      { name: 'whatever', query: { AS: 'whatever' } },
            $store:      {
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

      viewWrapper.vm.isScheduled = true;
      viewWrapper.vm.scheduledScanConfig = scheduledScanConfig;
      viewWrapper.vm.scanAlertRule = {};
      await viewWrapper.vm.$nextTick();

      const scheduling = viewWrapper.findAllComponents(RadioGroup).find((radioGroup) => radioGroup.props('name') === 'scheduling');

      expect(scheduling?.props('value')).toStrictEqual(true);
    });
  });
});
