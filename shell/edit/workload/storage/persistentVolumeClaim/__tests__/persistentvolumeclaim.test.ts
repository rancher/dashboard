import { mount } from '@vue/test-utils';
import PVC from '@shell/edit/workload/storage/persistentVolumeClaim/persistentvolumeclaim.vue';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';

const defaultStorageClass = {
  metadata: {
    name:        'default-sc',
    annotations: { 'storageclass.kubernetes.io/is-default-class': 'true' }
  }
};

/**
 * Mount the PVC form and run its `fetch` hook with a mocked store so the
 * storageClassName defaulting logic can be asserted per mode.
 */
async function mountAndFetch(mode: string, value: any) {
  const dispatch = jest.fn((action: string, { type }: { type: string }) => {
    if (type === 'storage.k8s.io.storageclass') {
      return Promise.resolve([defaultStorageClass]);
    }

    return Promise.resolve([]);
  });

  const wrapper = mount(PVC, {
    props: {
      mode,
      savePvcHookName: '',
      value
    },
    global: {
      mocks: {
        $store: {
          dispatch,
          getters: { 'i18n/t': jest.fn() }
        }
      },
      stubs: { LabeledSelect: { template: '<input />' } },
    },
  });

  await (wrapper.vm as any).$options.fetch.call(wrapper.vm);

  return wrapper;
}

describe('component: PVC storageClassName defaulting', () => {
  it('should default the storage class when creating a new PVC without one', async() => {
    const value = { spec: { resources: { requests: {} } } };
    const wrapper = await mountAndFetch(_CREATE, value);

    expect((wrapper.vm as any).spec.storageClassName).toBe('default-sc');
  });

  it.each([_EDIT, _VIEW])('should not mutate an empty storage class in %s mode', async(mode) => {
    // StatefulSet volumeClaimTemplates are immutable. Defaulting a previously
    // empty storageClassName on edit/view makes the save fail with a forbidden
    // update error, so the value must be left untouched.
    const value = { spec: { resources: { requests: {} } } };
    const wrapper = await mountAndFetch(mode, value);

    expect((wrapper.vm as any).spec.storageClassName).toBeUndefined();
  });

  it('should keep an existing storage class when editing', async() => {
    const value = { spec: { storageClassName: 'my-sc', resources: { requests: {} } } };
    const wrapper = await mountAndFetch(_EDIT, value);

    expect((wrapper.vm as any).spec.storageClassName).toBe('my-sc');
  });
});

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
});
