import { mount, shallowMount } from '@vue/test-utils';
import PVC from '@shell/edit/workload/storage/persistentVolumeClaim/persistentvolumeclaim.vue';
import { STORAGE_CLASS, PV } from '@shell/config/types';

const DEFAULT_SC_NAME = 'local-path';

const defaultStorageClass = {
  metadata: {
    name:        DEFAULT_SC_NAME,
    annotations: { 'storageclass.kubernetes.io/is-default-class': 'true' }
  }
};

/**
 * Mount the PVC form with a given spec, stubbing the store so that `fetch`
 * resolves a single default StorageClass.
 */
function mountPVC(spec: Record<string, any>, mode = 'edit') {
  return shallowMount(PVC, {
    props: {
      savePvcHookName: '',
      mode,
      value:           { spec },
    },
    global: {
      mocks: {
        $store: {
          dispatch: jest.fn((_action: string, opts: { type: string }) => {
            if (opts?.type === STORAGE_CLASS) {
              return Promise.resolve([defaultStorageClass]);
            }
            if (opts?.type === PV) {
              return Promise.resolve([]);
            }

            return Promise.resolve([]);
          }),
          getters: { 'i18n/t': () => '' },
        }
      }
    }
  });
}

describe('component: PVC', () => {
  // TODO: Enable test after allowing to test async data with either #9711 or #9322
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should initialize storage class on create mode', async() => {
    const name = 'test';
    const wrapper = mount(PVC, {
      props: {
        savePvcHookName: '',
        value:           { spec: { resources: { requests: {} } } }
      },

      global: {
        mocks: {
          $store: {
            getters: {
              'cluster/findAll': [{
                metadata: {
                  name,
                  annotations: { 'storageclass.beta.kubernetes.io/is-default-class': true }
                }
              }],
              'i18n/t': jest.fn()
            }
          }
        },

        stubs: { LabeledSelect: { template: '<input />' } },
      },
    });

    const inputElement = wrapper.find('[data-testid="storage-class-name"]').element as HTMLInputElement;

    expect(inputElement.value).toBe(name);
  });

  describe('storage class defaulting on load', () => {
    it('should default an empty storage class to the cluster default (new PVC)', async() => {
      // A new PVC is initialized via `applyDefaults`, so `storageClassName` is
      // present as an empty string.
      const wrapper = mountPVC({ storageClassName: '', resources: { requests: {} } });

      await (wrapper.vm.$options as any).fetch.call(wrapper.vm);

      expect(wrapper.vm.spec.storageClassName).toBe(DEFAULT_SC_NAME);
    });

    it('should default a new PVC even when editing an existing workload', async() => {
      const wrapper = mountPVC({ storageClassName: '', resources: { requests: {} } }, 'edit');

      await (wrapper.vm.$options as any).fetch.call(wrapper.vm);

      expect(wrapper.vm.spec.storageClassName).toBe(DEFAULT_SC_NAME);
    });

    it('should not add a storage class to an existing template without one', async() => {
      // An existing StatefulSet volumeClaimTemplate saved without a storage
      // class has no `storageClassName` key. `volumeClaimTemplates` is
      // immutable, so we must leave it untouched.
      const wrapper = mountPVC({ resources: { requests: {} } });

      await (wrapper.vm.$options as any).fetch.call(wrapper.vm);

      expect(wrapper.vm.spec.storageClassName).toBeUndefined();
    });

    it('should preserve an existing storage class', async() => {
      const wrapper = mountPVC({ storageClassName: 'custom-sc', resources: { requests: {} } });

      await (wrapper.vm.$options as any).fetch.call(wrapper.vm);

      expect(wrapper.vm.spec.storageClassName).toBe('custom-sc');
    });
  });

  it('should require the claim name', () => {
    const t = (key: string, args?: { key: string }) => (args ? `${ key }:${ args.key }` : key);
    const wrapper = shallowMount(PVC, {
      props: {
        savePvcHookName: '',
        value:           { metadata: {}, spec: { resources: { requests: {} } } },
      },
      global: { mocks: { $store: { dispatch: jest.fn(() => Promise.resolve([])), getters: { 'i18n/t': t } } } },
    });

    const nameInput = wrapper.findAllComponents({ name: 'LabeledInput' }).find((input) => input.props('label') === 'persistentVolumeClaim.name');
    const [required] = nameInput?.props('rules');

    expect(required('')).toStrictEqual('validation.required:persistentVolumeClaim.name');
    expect(required('claim')).toBeUndefined();
  });

  it('should require the capacity of a new persistent volume', () => {
    const t = (key: string, args?: { key: string }) => (args ? `${ key }:${ args.key }` : key);
    const wrapper = shallowMount(PVC, {
      props: {
        savePvcHookName: '',
        value:           { metadata: {}, spec: { resources: { requests: {} } } },
      },
      global: { mocks: { $store: { dispatch: jest.fn(() => Promise.resolve([])), getters: { 'i18n/t': t } } } },
    });

    const [required] = wrapper.findComponent({ name: 'UnitInput' }).vm.$attrs.rules as any[];

    expect(required('')).toStrictEqual('validation.required:persistentVolumeClaim.capacity');
    expect(required('10')).toBeUndefined();
  });
});
