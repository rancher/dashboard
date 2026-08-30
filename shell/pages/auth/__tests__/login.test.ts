import { shallowMount, VueWrapper } from '@vue/test-utils';
import Login from '@shell/pages/auth/login.vue';

let mockBrandMeta: Record<string, any> = {};

jest.mock('@shell/utils/brand', () => ({ getBrandMeta: () => mockBrandMeta }));

// Mimics the real translations so the assertions are made against the rendered accessible
// names rather than just the keys being used.
const t = (key: string, args?: Record<string, string>) => {
  if (key === 'login.logoAlt') {
    return `${ args?.vendor } Logo`;
  }

  return `%${ key }%`;
};

function createWrapper(storeOverride = {}): VueWrapper<any, any> {
  return shallowMount(Login, {
    global: {
      mocks: {
        $fetchState: { pending: false },
        $route:      { query: {}, params: {} },
        $router:     { replace: jest.fn(), push: jest.fn() },
        $store:      {
          getters: {
            'i18n/t':                  t,
            'i18n/hasMultipleLocales': false,
            'management/brand':        null,
            isSingleProduct:           false,
            ...storeOverride,
          },
          dispatch: jest.fn(),
          commit:   jest.fn(),
        },
      },
      stubs: {
        AsyncButton:    { template: '<button />' },
        Banner:         { template: '<div />' },
        BrandImage:     { template: '<span />' },
        Checkbox:       { template: '<div />' },
        CopyCode:       { template: '<div />' },
        InfoBox:        { template: '<div />' },
        LabeledInput:   { template: '<input />' },
        Loading:        { template: '<div />' },
        LocaleSelector: { template: '<div />' },
        Password:       { template: '<div />' },
        TabTitle:       { template: '<div><slot /></div>' },
      },
    },
  }) as VueWrapper<any, any>;
}

describe('page: login', () => {
  afterEach(() => {
    mockBrandMeta = {};
  });

  describe('a11y: landscape image', () => {
    it('should be decorative, so it is skipped by screen readers', () => {
      const wrapper = createWrapper();

      const landscape = wrapper.find('[data-testid="login-landscape__img"]');

      expect(landscape.exists()).toBe(true);
      expect(landscape.attributes('alt')).toBe('');
    });

    it('should not expose an accessible name for the landscape image', () => {
      const wrapper = createWrapper();

      const landscape = wrapper.find('[data-testid="login-landscape__img"]');

      expect(landscape.attributes('alt')).not.toContain('landscape');
      expect(landscape.attributes('aria-label')).toBeUndefined();
    });
  });

  describe('a11y: brand logo', () => {
    const findLogo = (wrapper: VueWrapper<any, any>) => wrapper.find('.login-logo');

    it('should not render a logo when the brand does not provide one', () => {
      const wrapper = createWrapper();

      expect(findLogo(wrapper).exists()).toBe(false);
      expect(wrapper.text()).toContain('%login.howdy%');
    });

    it('should describe the logo with the vendor name rather than the landscape text', () => {
      mockBrandMeta = { login: { logo: 'custom-logo.svg', logoClass: 'login-logo' } };

      const wrapper = createWrapper();
      const logo = findLogo(wrapper);

      expect(logo.exists()).toBe(true);
      expect(logo.attributes('alt')).toBe('Rancher Logo');
      expect(logo.attributes('alt')).not.toBe('%login.landscapeAlt%');
    });

    it('should not share its accessible name with the decorative landscape image', () => {
      mockBrandMeta = { login: { logo: 'custom-logo.svg', logoClass: 'login-logo' } };

      const wrapper = createWrapper();

      const logoAlt = findLogo(wrapper).attributes('alt');
      const landscapeAlt = wrapper.find('[data-testid="login-landscape__img"]').attributes('alt');

      expect(logoAlt).not.toBe(landscapeAlt);
      expect(landscapeAlt).toBe('');
    });
  });
});
