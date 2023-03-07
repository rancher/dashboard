import { shallowMount } from '@vue/test-utils';
import { Banner } from '@components/Banner';
import EditConnectModeDialogVue from '@shell/dialog/EditConnectModeDialog.vue';

describe('component: EditConnectModeDialog', () => {
  it('should clear old error message after verifying the connection', async() => {
    const wrapper = shallowMount(EditConnectModeDialogVue, {
      propsData: {
        resources: [
          {
            id:       'test',
            metadata: { name: 'test' }
          }
        ]
      },
      mocks: {
        $store: {
          dispatch: jest.fn(() => Promise.resolve({})),
          getters:  { 'i18n/t': jest.fn() }
        }
      }
    });

    await wrapper.setData({ errors: ['error'] });
    expect(wrapper.findComponent(Banner).props('label')).toStrictEqual('error');

    await wrapper.setData({ mode: { apiEndpoints: ['test'] } });
    const done = jest.fn();

    await wrapper.vm.validate(done);
    expect(done).toHaveBeenCalledWith(true);
    expect(wrapper.vm.$data.errors).toStrictEqual([]);
  });
  it('should show error message after verifying the connection failed', async() => {
    const wrapper = shallowMount(EditConnectModeDialogVue, {
      propsData: {
        resources: [
          {
            id:       'test',
            metadata: { name: 'test' }
          }
        ]
      },
      mocks: {
        $store: {
          dispatch: jest.fn(() => Promise.reject(new Error('error'))),
          getters:  { 'i18n/t': jest.fn() }
        }
      }
    });

    await wrapper.setData({ mode: { apiEndpoints: ['test'] } });
    const done = jest.fn();

    await wrapper.vm.validate(done);
    expect(done).toHaveBeenCalledWith(false);
    expect(wrapper.findComponent(Banner).props('label')).toStrictEqual('error');
  });
});
