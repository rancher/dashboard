import { shallowMount } from '@vue/test-utils';
import RedeployWorkloadDialog from '@shell/dialog/RedeployWorkloadDialog.vue';
import { TIMESTAMP, KUBECTL_RESTARTED_AT } from '@shell/config/labels-annotations';

const defaultStubs = {
  Card:        true,
  AsyncButton: true,
  Banner:      true,
};

const defaultMocks = {
  $store: {
    getters: {
      'i18n/t':            jest.fn((key: string) => key),
      'type-map/labelFor': jest.fn(() => 'Deployment'),
    },
  },
  t: jest.fn((key: string) => key),
};

function createWorkload(overrides = {}) {
  return {
    nameDisplay: 'my-workload',
    type:        'apps.deployment',
    schema:      { id: 'apps.deployment' },
    spec:        { template: { metadata: { annotations: {} } } },
    save:        jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('component: RedeployWorkloadDialog', () => {
  const createWrapper = (props = {}, mocks = {}) => {
    return shallowMount(RedeployWorkloadDialog, {
      props: {
        workloads: [createWorkload()],
        ...props,
      },
      global: {
        mocks: {
          ...defaultMocks,
          ...mocks,
        },
        stubs: defaultStubs,
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const wrapper = createWrapper();

    expect(wrapper.exists()).toBe(true);
  });

  describe('apply', () => {
    it('should set both TIMESTAMP and kubectl restartedAt annotations', async() => {
      const workload = createWorkload();
      const wrapper = createWrapper({ workloads: [workload] });
      const buttonDone = jest.fn();

      await (wrapper.vm as any).apply(buttonDone);

      const annotations = workload.spec.template.metadata.annotations as Record<string, string>;

      expect(annotations[TIMESTAMP]).toBeDefined();
      expect(annotations[KUBECTL_RESTARTED_AT]).toBeDefined();
      expect(annotations[TIMESTAMP]).toStrictEqual(annotations[KUBECTL_RESTARTED_AT]);
      expect(workload.save).toHaveBeenCalledWith();
      expect(buttonDone).toHaveBeenCalledWith(true);
    });

    it('should set annotations as ISO timestamps without milliseconds', async() => {
      const workload = createWorkload();
      const wrapper = createWrapper({ workloads: [workload] });

      await (wrapper.vm as any).apply();

      const ts = (workload.spec.template.metadata.annotations as Record<string, string>)[KUBECTL_RESTARTED_AT];

      expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    it('should initialize metadata and annotations when missing', async() => {
      const workload = createWorkload({ spec: { template: {} } });
      const wrapper = createWrapper({ workloads: [workload] });

      await (wrapper.vm as any).apply();

      const annotations = workload.spec.template.metadata.annotations as Record<string, string>;

      expect(annotations[TIMESTAMP]).toBeDefined();
      expect(annotations[KUBECTL_RESTARTED_AT]).toBeDefined();
    });

    it('should redeploy all workloads', async() => {
      const workloads = [createWorkload(), createWorkload(), createWorkload()];
      const wrapper = createWrapper({ workloads });

      await (wrapper.vm as any).apply();

      for (const w of workloads) {
        const annotations = w.spec.template.metadata.annotations as Record<string, string>;

        expect(w.save).toHaveBeenCalledWith();
        expect(annotations[TIMESTAMP]).toBeDefined();
        expect(annotations[KUBECTL_RESTARTED_AT]).toBeDefined();
      }
    });

    it('should report errors and call buttonDone(false) on failure', async() => {
      const workload = createWorkload({ save: jest.fn().mockRejectedValue(new Error('save failed')) });
      const wrapper = createWrapper({ workloads: [workload] });
      const buttonDone = jest.fn();

      await (wrapper.vm as any).apply(buttonDone);

      expect(buttonDone).toHaveBeenCalledWith(false);
      expect((wrapper.vm as any).errors.length).toBeGreaterThan(0);
    });
  });
});
