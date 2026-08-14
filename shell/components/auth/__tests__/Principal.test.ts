import { mount, shallowMount, type VueWrapper } from '@vue/test-utils';
import Principal from '@shell/components/auth/Principal.vue';
import { MANAGEMENT, NORMAN } from '@shell/config/types';

describe('component: Principal', () => {
  it('should render the component', () => {
    const wrapper = mount(Principal, {
      props:  { value: 'whatever' },
      global: { mocks: { $fetchState: { pending: false } } },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('a11y: should render the avatar as a decorative image, hidden from screen readers', async() => {
    const wrapper: VueWrapper<any, any> = mount(Principal, {
      props:  { value: 'whatever' },
      global: {
        mocks: {
          $fetchState: { pending: false },
          $store:      {
            getters: {
              'rancher/byId': () => ({
                name:        'first name',
                loginName:   'first',
                avatarSrc:   'data:image/png;base64,abc',
                roundAvatar: true,
              })
            }
          },
        },
      },
    });

    await wrapper.vm.loadData();

    const avatar = wrapper.find('.avatar img');

    expect(avatar.exists()).toBe(true);
    // the name is already exposed as text next to it, so the image adds nothing for AT
    expect(avatar.attributes('alt')).toBe('');
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

  // A standard (non-admin) user may lack permission to read principals but still
  // be able to read the user list. In that case the direct principal fetch fails
  // and Principal.vue falls back to resolving the member from the users the page
  // has already loaded into the store (e.g. via ExplorerMembers).
  describe('given the principal fetch fails (user-based fallback)', () => {
    const value = 'local://u-abc123';

    const forbidden = () => {
      throw new Error('forbidden');
    };

    /**
     * Build a dispatch spy + $store mock for the fallback scenarios.
     * @param usersLoaded whether the user type has been registered/loaded in the store
     * @param users the users the store returns from the `management/all` getter
     * @param find behaviour of the direct `rancher/find` principal lookup
     */
    const createStore = ({ usersLoaded = true, users = [] as any[], find = () => null }) => {
      const dispatch = jest.fn((action: string, payload: any) => {
        switch (action) {
        case 'rancher/find':
          return find();
        case 'rancher/create':
          // classify() returns a model instance - echo the data back for the test
          return Promise.resolve(payload);
        default:
          return undefined;
        }
      });

      const $store = {
        getters: {
          'rancher/byId':              () => null,
          'management/typeRegistered': (type: string) => usersLoaded && type === MANAGEMENT.USER,
          'management/all':            (type: string) => (type === MANAGEMENT.USER ? users : []),
        },
        dispatch,
      };

      return { $store, dispatch };
    };

    const mountComponent = ($store: any): VueWrapper<any, any> => shallowMount(Principal, {
      props:  { value },
      global: { mocks: { $fetchState: { pending: false }, $store } },
    }) as VueWrapper<any, any>;

    it('should build a principal from the matching user', async() => {
      const user = {
        principalIds:  [value],
        displayName:   'Base User',
        username:      'base-user',
        provider:      'local',
        isCurrentUser: false,
      };
      const { $store, dispatch } = createStore({ users: [user], find: forbidden });

      await mountComponent($store).vm.loadData();

      expect(dispatch).toHaveBeenCalledWith('rancher/create', {
        type:          NORMAN.PRINCIPAL,
        id:            value,
        principalType: 'user',
        provider:      'local',
        name:          'Base User',
        loginName:     'base-user',
        me:            false,
      });
    });

    // Regression: user.provider is aggregated across all of the user's principalIds,
    // so a user with more than one resolves to 'multiple' (or the wrong driver). The
    // rendered principal must take its provider from its own id so it isn't mislabeled.
    // (The missing github profile picture is handled by Principal.avatarSrc, which falls
    // back to an identicon rather than throwing - covered in the principal model tests.)
    it('should derive the provider from the id, not the aggregated user.provider (github, multi-principal user)', async() => {
      const githubValue = 'github_user://12345';
      const user = {
        principalIds:  [githubValue, 'local://u-abc123'],
        displayName:   'GH User',
        username:      'gh-user',
        provider:      'multiple', // aggregated - must NOT be used for the rendered id
        isCurrentUser: false,
      };
      const { $store, dispatch } = createStore({ users: [user], find: forbidden });

      const wrapper = shallowMount(Principal, {
        props:  { value: githubValue },
        global: { mocks: { $fetchState: { pending: false }, $store } },
      }) as VueWrapper<any, any>;

      await wrapper.vm.loadData();

      expect(dispatch).toHaveBeenCalledWith('rancher/create', {
        type:          NORMAN.PRINCIPAL,
        id:            githubValue,
        principalType: 'user',
        provider:      'github',
        name:          'GH User',
        loginName:     'gh-user',
        me:            false,
      });
    });

    it('should resolve the display name from the matching user', async() => {
      const user = {
        principalIds: [value], displayName: 'Base User', username: 'base-user'
      };
      const { $store } = createStore({ users: [user], find: forbidden });
      const wrapper = mountComponent($store);

      await wrapper.vm.loadData();

      expect(wrapper.vm.principal.name).toStrictEqual('Base User');
    });

    it('should fall back to nameDisplay when the user has no display name', async() => {
      const user = {
        principalIds: [value], username: 'base-user', nameDisplay: 'base-user'
      };
      const { $store } = createStore({ users: [user], find: forbidden });
      const wrapper = mountComponent($store);

      await wrapper.vm.loadData();

      expect(wrapper.vm.principal.name).toStrictEqual('base-user');
    });

    it('should not build a principal when no users are loaded', async() => {
      const { $store, dispatch } = createStore({ usersLoaded: false, find: forbidden });

      await mountComponent($store).vm.loadData();

      expect(dispatch).not.toHaveBeenCalledWith('rancher/create', expect.anything());
    });

    it('should leave the principal null when no users are loaded', async() => {
      const { $store } = createStore({ usersLoaded: false, find: forbidden });
      const wrapper = mountComponent($store);

      await wrapper.vm.loadData();

      expect(wrapper.vm.principal).toBeNull();
    });

    it('should leave the principal null when no user matches the principal id', async() => {
      const users = [{ principalIds: ['local://u-other'], username: 'other' }];
      const { $store } = createStore({ users, find: forbidden });
      const wrapper = mountComponent($store);

      await wrapper.vm.loadData();

      expect(wrapper.vm.principal).toBeNull();
    });
  });
});
