import { shallowMount } from '@vue/test-utils';
import AuthProviderDetails from '@shell/components/auth/AuthProviderDetails.vue';

const createWrapper = (config: any, name = 'GitHub') => {
  const store = { getters: { 'i18n/t': (key: string) => key } };

  return shallowMount(AuthProviderDetails, {
    props:  { config, name },
    global: { provide: { store }, mocks: { $store: store } },
  });
};

const pairs = (wrapper: any) => wrapper.findAll('.auth-provider-details__item').map((item: any) => [
  item.find('.auth-provider-details__label').text(),
  item.find('.auth-provider-details__value').text(),
]);

describe('component: AuthProviderDetails', () => {
  it('should show how the provider is configured', () => {
    const config = {
      id: 'github', hostname: 'github.com', tls: true, clientId: 'abc123'
    };

    expect(pairs(createWrapper(config))).toStrictEqual([
      ['authConfig.access.type', 'model.authConfig.description.oauth'],
      ['authConfig.github.table.server', 'https://github.com'],
      ['authConfig.github.table.clientId', 'abc123'],
    ]);
  });

  // An empty list would otherwise leave a gap above the form
  it.each([
    ['there is no config to describe', null],
    ['the provider is not one it knows', { id: 'somethingelse' }],
  ])('should show nothing when %s', (_label, config) => {
    expect(createWrapper(config).find('[data-testid="auth-provider-details"]').exists()).toBe(false);
  });
});
