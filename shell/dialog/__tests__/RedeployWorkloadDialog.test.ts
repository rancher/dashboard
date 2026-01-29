import { shallowMount, VueWrapper } from '@vue/test-utils';
import RedeployWorkloadDialog from '@shell/dialog/RedeployWorkloadDialog.vue';
import { TIMESTAMP, RESTARTED_AT } from '@shell/config/labels-annotations';

const t = (key: string): string => key;
const labelFor = (schema: any, count: number): string => 'Deployment';

describe('component: RedeployWorkloadDialog', () => {
  let wrapper: VueWrapper<any>;

  const createMockWorkload = (type = 'apps.deployment') => {
    const workload: any = {
      nameDisplay: 'test-workload',
      type,
      schema:      { id: type },
      spec:        {
        template: {
          metadata: {
            annotations: {}
          }
        }
      },
      save: jest.fn().mockResolvedValue({})
    };

    return workload;
  };

  const mountComponent = (propsData = {}) => {
    const defaultProps = {
      workloads: [createMockWorkload()],
    };

    return shallowMount(RedeployWorkloadDialog, {
      propsData: {
        ...defaultProps,
        ...propsData,
      },
      global: {
        mocks: {
          $store: {
            getters: {
              'i18n/t':        t,
              'type-map/labelFor': labelFor,
            }
          },
        },
      },
    });
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('apply method', () => {
    it('should set both TIMESTAMP and RESTARTED_AT annotations', async() => {
      const workload = createMockWorkload();

      wrapper = mountComponent({ workloads: [workload] });

      const buttonDone = jest.fn();

      await wrapper.vm.apply(buttonDone);

      const annotations = workload.spec.template.metadata.annotations;

      expect(annotations[TIMESTAMP]).toBeDefined();
      expect(annotations[RESTARTED_AT]).toBeDefined();
      expect(annotations[TIMESTAMP]).toBe(annotations[RESTARTED_AT]);
      expect(workload.save).toHaveBeenCalled();
      expect(buttonDone).toHaveBeenCalledWith(true);
    });

    it('should set annotations to the same timestamp value', async() => {
      const workload = createMockWorkload();

      wrapper = mountComponent({ workloads: [workload] });

      const buttonDone = jest.fn();

      await wrapper.vm.apply(buttonDone);

      const annotations = workload.spec.template.metadata.annotations;
      const timestampValue = annotations[TIMESTAMP];
      const restartedAtValue = annotations[RESTARTED_AT];

      expect(timestampValue).toBe(restartedAtValue);
      expect(timestampValue).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    it('should handle multiple workloads', async() => {
      const workload1 = createMockWorkload();
      const workload2 = createMockWorkload('apps.statefulset');

      wrapper = mountComponent({ workloads: [workload1, workload2] });

      const buttonDone = jest.fn();

      await wrapper.vm.apply(buttonDone);

      expect(workload1.spec.template.metadata.annotations[TIMESTAMP]).toBeDefined();
      expect(workload1.spec.template.metadata.annotations[RESTARTED_AT]).toBeDefined();
      expect(workload2.spec.template.metadata.annotations[TIMESTAMP]).toBeDefined();
      expect(workload2.spec.template.metadata.annotations[RESTARTED_AT]).toBeDefined();
      expect(workload1.save).toHaveBeenCalled();
      expect(workload2.save).toHaveBeenCalled();
      expect(buttonDone).toHaveBeenCalledWith(true);
    });

    it('should create metadata object if it does not exist', async() => {
      const workload = createMockWorkload();

      delete workload.spec.template.metadata;

      wrapper = mountComponent({ workloads: [workload] });

      const buttonDone = jest.fn();

      await wrapper.vm.apply(buttonDone);

      expect(workload.spec.template.metadata).toBeDefined();
      expect(workload.spec.template.metadata.annotations[TIMESTAMP]).toBeDefined();
      expect(workload.spec.template.metadata.annotations[RESTARTED_AT]).toBeDefined();
    });

    it('should create annotations object if it does not exist', async() => {
      const workload = createMockWorkload();

      delete workload.spec.template.metadata.annotations;

      wrapper = mountComponent({ workloads: [workload] });

      const buttonDone = jest.fn();

      await wrapper.vm.apply(buttonDone);

      expect(workload.spec.template.metadata.annotations).toBeDefined();
      expect(workload.spec.template.metadata.annotations[TIMESTAMP]).toBeDefined();
      expect(workload.spec.template.metadata.annotations[RESTARTED_AT]).toBeDefined();
    });

    it('should call buttonDone with false when save fails', async() => {
      const workload = createMockWorkload();

      jest.spyOn(workload, 'save').mockRejectedValue(new Error('Save failed'));

      wrapper = mountComponent({ workloads: [workload] });

      const buttonDone = jest.fn();

      await wrapper.vm.apply(buttonDone);

      expect(buttonDone).toHaveBeenCalledWith(false);
      expect(wrapper.vm.errors).toHaveLength(1);
    });

    it('should emit close event on success', async() => {
      const workload = createMockWorkload();

      wrapper = mountComponent({ workloads: [workload] });

      const buttonDone = jest.fn();

      await wrapper.vm.apply(buttonDone);

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should not emit close event on failure', async() => {
      const workload = createMockWorkload();

      jest.spyOn(workload, 'save').mockRejectedValue(new Error('Save failed'));

      wrapper = mountComponent({ workloads: [workload] });

      const buttonDone = jest.fn();

      await wrapper.vm.apply(buttonDone);

      expect(wrapper.emitted('close')).toBeFalsy();
    });
  });
});
