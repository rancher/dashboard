import { mount } from '@vue/test-utils';
import Storage from '@shell/edit//workload/storage/index.vue';

describe('component: Storage', () => {
  describe.each([
    'awsElasticBlockStore',
    'azureDisk',
    'azureFile',
    'configMap',
    // 'createPVC',
    'csi',
    'emptyDir',
    'gcePersistentDisk',
    'gcePersistentDisk',
    'hostPath',
    'secret',
    'vsphereVolume'
  ])('given volume type %p', (volumeType) => {
    it('should display the volume name as first input of the form array', () => {
      const name = 'whatever';
      const wrapper = mount(Storage, {
        props: {
          savePvcHookName: '',
          value:           {
            volumes: [{
              _type:        volumeType,
              [volumeType]: {},
              name
            }]
          },
        },
        global: {
          mocks: {
            t:      (text: string) => text, // Mock i18n global function used as alternative to the getter
            $store: {
              getters: {
                'i18n/t':      jest.fn().mockImplementation((key: string) => key),
                'i18n/exists': jest.fn()
              }
            }
          },
        },
      });

      const input = wrapper.find('input').element as HTMLInputElement;

      expect(input.value).toStrictEqual(name);
    });

    it('should edit the volume name', () => {
      const name = 'whatever';
      const newName = 'new whatever';
      const wrapper = mount(Storage, {
        props: {
          savePvcHookName: '',
          value:           {
            volumes: [{
              _type:        volumeType,
              [volumeType]: {},
              name
            }]
          },
        },
        global: {
          mocks: {
            t:      (text: string) => text, // Mock i18n global function used as alternative to the getter
            $store: {
              getters: {
                'i18n/t':      jest.fn().mockImplementation((key: string) => key),
                'i18n/exists': jest.fn()
              }
            }
          },
        },
      });

      wrapper.find('input').setValue(newName);

      expect(wrapper.vm.value.volumes[0].name).toStrictEqual(newName);
    });
  });

  // TODO: find how to interact with the tooltip selection outside of the component
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should allow to add a new volume', async() => {
    const wrapper = mount(Storage, {
      props:  { savePvcHookName: '' },
      global: {
        mocks: {
          t:      (text: string) => text, // Mock i18n global function used as alternative to the getter
          $store: { getters: { 'i18n/t': jest.fn() } }
        },
      },
    });

    await wrapper.find('#select-volume').trigger('click');
    await wrapper.trigger('keydown.down');
    await wrapper.trigger('keydown.enter');

    expect(wrapper.vm.value.volumes[0]).toStrictEqual({
      _type:                'awsElasticBlockStore',
      awsElasticBlockStore: {},
      name:                 ''
    });
  });
});
