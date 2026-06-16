import { mount } from '@vue/test-utils';
import Latest from '@shell/components/ResourceDetail/Masthead/latest.vue';

jest.mock('@shell/components/Resource/Detail/TitleBar/index.vue', () => ({
  name:     'TitleBar',
  template: `<div data-testid="title-bar">TitleBar</div>`
}));
jest.mock('@shell/components/Resource/Detail/TitleBar/composables', () => ({ useDefaultTitleBarProps: jest.fn(() => ({})) }));
jest.mock('@shell/components/Resource/Detail/Metadata/index.vue', () => ({
  name:     'Metadata',
  template: `<div data-testid="metadata">Metadata</div>`
}));
jest.mock('@shell/components/Resource/Detail/Metadata/composables', () => ({ useDefaultMetadataForLegacyPagesProps: jest.fn(() => ({})) }));
jest.mock('@shell/components/Resource/Detail/composables', () => ({ useResourceDetailBannerProps: jest.fn(() => null) }));
jest.mock('@shell/components/Resource/Detail/Cards.vue', () => ({
  name:     'Cards',
  template: `<div data-testid="cards">Cards</div>`,
  props:    ['resource']
}));
jest.mock('@components/Banner', () => ({
  Banner: {
    name:     'Banner',
    template: `<div data-testid="banner">Banner</div>`
  }
}));

const defaultMocks = {
  directives: { 'ui-context': () => {} },
  global:     {
    mocks: {
      $store: {
        getters:  { 'i18n/t': jest.fn() },
        dispatch: jest.fn()
      }
    }
  }
};

describe('component: Masthead/latest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render Cards when isCustomDetailOrEdit is true', () => {
    const props = {
      value:                { name: 'test-resource' },
      isCustomDetailOrEdit: true
    };

    const wrapper = mount(Latest, { props, ...defaultMocks });

    expect(wrapper.find('[data-testid="cards"]').exists()).toBe(true);
  });

  it('should not render Cards when isCustomDetailOrEdit is false', () => {
    const props = {
      value:                { name: 'test-resource' },
      isCustomDetailOrEdit: false
    };

    const wrapper = mount(Latest, { props, ...defaultMocks });

    expect(wrapper.find('[data-testid="cards"]').exists()).toBe(false);
  });

  it('should not render Cards when isCustomDetailOrEdit is not provided (defaults to false)', () => {
    const props = { value: { name: 'test-resource' } };

    const wrapper = mount(Latest, { props, ...defaultMocks });

    expect(wrapper.find('[data-testid="cards"]').exists()).toBe(false);
  });

  it('should always render TitleBar and Metadata', () => {
    const props = {
      value:                { name: 'test-resource' },
      isCustomDetailOrEdit: false
    };

    const wrapper = mount(Latest, { props, ...defaultMocks });

    expect(wrapper.find('[data-testid="title-bar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="metadata"]').exists()).toBe(true);
  });
});
