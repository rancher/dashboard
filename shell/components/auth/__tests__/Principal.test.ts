import { mount, type VueWrapper } from '@vue/test-utils';
import Principal from '@shell/components/auth/Principal.vue';

describe('component: Principal', () => {
  it('should render the component', () => {
    const wrapper = mount(Principal, {
      props:  { value: 'whatever' },
      global: { mocks: { $fetchState: { pending: false } } },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should update principal displayed properties on value change', async() => {
    const wrapper: VueWrapper<any, any> = mount(Principal, {
      props:  { value: 'whatever' },
      global: {
        mocks: {
          $fetchState: { pending: false },
          $store:      {
            getters: {
              'rancher/byId': (_: any, id: 'first' | 'second') => {
                const options = {
                  first:  { name: 'first name' },
                  second: { name: 'second name' }
                };

                return options[id];
              }
            }
          },
        },
      },
    });

    await wrapper.setProps({ value: 'second' });

    expect(wrapper.vm.principal.name).toStrictEqual('second name');
  });
});
