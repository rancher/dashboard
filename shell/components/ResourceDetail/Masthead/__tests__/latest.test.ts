import { mount } from '@vue/test-utils';
import Latest from '@shell/components/ResourceDetail/Masthead/latest.vue';
import { _VIEW, _EDIT } from '@shell/config/query-params';

jest.mock('@shell/components/Resource/Detail/TitleBar/index.vue', () => ({
  name:     'TitleBar',
  template: `<div data-testid="title-bar">TitleBar<slot name="additional-actions" /></div>`
}));
jest.mock('@shell/components/ResourceTemplateSelector', () => ({
  name:     'ResourceTemplateSelector',
  template: `<div data-testid="resource-template-selector">ResourceTemplateSelector</div>`,
  props:    ['resourceType'],
  emits:    ['apply', 'save'],
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

  describe('ResourceTemplateSelector', () => {
    it('should render when mode is not _VIEW and canViewYaml is true', () => {
      const props = {
        value: { name: 'test-resource' }, mode: _EDIT, resource: 'apps.deployment', canViewYaml: true
      };

      const wrapper = mount(Latest, { props, ...defaultMocks });

      expect(wrapper.find('[data-testid="resource-template-selector"]').exists()).toBe(true);
    });

    it('should not render when mode is _VIEW, since Masthead/index.vue only renders Latest in view mode', () => {
      const props = {
        value: { name: 'test-resource' }, mode: _VIEW, resource: 'apps.deployment', canViewYaml: true
      };

      const wrapper = mount(Latest, { props, ...defaultMocks });

      expect(wrapper.find('[data-testid="resource-template-selector"]').exists()).toBe(false);
    });

    it('should not render when canViewYaml is false', () => {
      const props = {
        value: { name: 'test-resource' }, mode: _EDIT, resource: 'apps.deployment', canViewYaml: false
      };

      const wrapper = mount(Latest, { props, ...defaultMocks });

      expect(wrapper.find('[data-testid="resource-template-selector"]').exists()).toBe(false);
    });

    it('should relay apply as apply-template', async() => {
      const props = {
        value: { name: 'test-resource' }, mode: _EDIT, resource: 'apps.deployment', canViewYaml: true
      };

      const wrapper = mount(Latest, { props, ...defaultMocks });
      const configMap = { metadata: { namespace: 'default', name: 'my-template' } };

      await wrapper.getComponent({ name: 'ResourceTemplateSelector' }).vm.$emit('apply', configMap);

      expect(wrapper.emitted('apply-template')).toBeTruthy();
      expect(wrapper.emitted('apply-template')![0]).toStrictEqual([configMap]);
    });

    it('should relay save as save-template', async() => {
      const props = {
        value: { name: 'test-resource' }, mode: _EDIT, resource: 'apps.deployment', canViewYaml: true
      };

      const wrapper = mount(Latest, { props, ...defaultMocks });

      await wrapper.getComponent({ name: 'ResourceTemplateSelector' }).vm.$emit('save');

      expect(wrapper.emitted('save-template')).toBeTruthy();
    });
  });
});
