import { mount, type VueWrapper } from '@vue/test-utils';
import Principal from '@shell/components/auth/Principal.vue';
import { NORMAN } from '@shell/config/types';

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

  it('should encode the principal id with valid UTF-8 percent-encoding when fetching', async() => {
    // DN containing non-ASCII (Chinese) characters and forward slashes
    const value = 'activedirectory_user://CN=Zhang San 张三,OU=测试部门,DC=example';
    const dispatch = jest.fn();
    const wrapper: VueWrapper<any, any> = mount(Principal, {
      props:  { value },
      global: {
        mocks: {
          $fetchState: { pending: false },
          $store:      {
            getters: { 'rancher/byId': () => null },
            dispatch,
          },
        },
      },
    });

    await wrapper.vm.loadData();

    // encodeURIComponent encodes the whole id as a single path segment: slashes as
    // %2F and non-ASCII (Chinese) as valid UTF-8 - never the deprecated escape() %uXXXX.
    const expectedId = encodeURIComponent(value);
    const calledUrl = dispatch.mock.calls[0][1].opt.url;

    expect(dispatch).toHaveBeenCalledWith('rancher/find', {
      type: NORMAN.PRINCIPAL,
      id:   value,
      opt:  { url: `/v3/principals/${ expectedId }` }
    });
    // Forward slashes encoded as %2F
    expect(calledUrl).toContain('%2F%2F');
    // Chinese characters encoded as valid UTF-8 (not the deprecated escape() %uXXXX)
    expect(calledUrl).toContain('%E5%BC%A0%E4%B8%89');
    expect(calledUrl).not.toMatch(/%u[0-9a-fA-F]{4}/);
  });
});
