import { mount } from '@vue/test-utils';
import PVC from '@shell/edit/workload/storage/persistentVolumeClaim/persistentvolumeclaim.vue';

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
