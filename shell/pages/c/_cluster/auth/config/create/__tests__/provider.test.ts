import { shallowMount } from '@vue/test-utils';
import AuthConfigCreateProvider from '@shell/pages/c/_cluster/auth/config/create/_provider.vue';

const template = { id: 'github', _type: 'githubConfig' };

const createWrapper = (provider = 'github') => shallowMount(AuthConfigCreateProvider, {
  // The page loads its configs in fetch(), which shallowMount does not run
  data: () => ({
    template, value: {}, editComponent: {}
  } as any),
  global: {
    mocks: {
      $route:      { params: { cluster: 'local', provider } },
      $fetchState: { pending: false, error: null },
      $store:      {
        dispatch: jest.fn(),
        getters:  { 'i18n/withFallback': () => 'GitHub' },
      },
    },
  },
}) as any;

describe('page: AuthConfigCreateProvider', () => {
  // The provider's own form renders the name and description, and creates the
  // config when it first saves - this page tells it what it needs to do that.
  it('should hand the provider form what it needs to create a config', () => {
    const wrapper = createWrapper();

    expect(wrapper.vm.authConfigCreate).toStrictEqual({
      name:       '',
      normanType: '',
      takenIds:   [],
      created:    false,
    });
  });

  it('should report a provider this Rancher does not have', () => {
    const wrapper = shallowMount(AuthConfigCreateProvider, {
      data:   () => ({ template: null } as any),
      global: {
        mocks: {
          $route:      { params: { cluster: 'local', provider: 'nonsense' } },
          $fetchState: { pending: false, error: null },
          $store:      { dispatch: jest.fn(), getters: { 'i18n/withFallback': () => 'nonsense' } },
        },
      },
    }) as any;

    expect(wrapper.find('[data-testid="auth-config-back"]').exists()).toBe(false);
  });
});
