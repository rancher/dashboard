import { mount } from '@vue/test-utils';
import Setting from '@shell/components/Setting.vue';

describe('component: Setting', () => {
  const mockT = (key: string, args?: { [key: string]: string }) => {
    if (key === 'advancedSettings.edit.moreActions' && args?.setting) {
      return `More actions for setting - ${ args.setting }`;
    }
    if (key === 'advancedSettings.setEnv') {
      return 'Set by Environment Variable';
    }
    if (key === 'advancedSettings.modified') {
      return 'Modified';
    }
    if (key.startsWith('advancedSettings.descriptions.')) {
      return 'Setting description';
    }

    return key;
  };

  const createWrapper = (overrides = {}) => {
    const defaultValue = {
      id:         'password-min-length',
      data:       { value: '8', default: '8' },
      hasActions: true,
      fromEnv:    false,
      customized: false,
      canHide:    false,
      kind:       'text',
      ...overrides
    };

    return mount(Setting, {
      props:  { value: defaultValue },
      global: {
        mocks: {
          $store: {
            getters: {
              'i18n/t':                   mockT,
              'action-menu/optionsArray': () => []
            }
          }
        },
        stubs: {
          'action-menu': {
            name:     'ActionMenu',
            template: '<button :aria-label="buttonAriaLabel" data-testid="action-button" />',
            props:    ['resource', 'buttonAriaLabel', 'buttonVariant']
          }
        }
      }
    });
  };

  it('should render setting component with title and description', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('h1').text()).toContain('password-min-length');
    expect(wrapper.find('h2').text()).toBe('Setting description');
  });

  it('a11y: action menu should have contextual aria-label with setting id', () => {
    const wrapper = createWrapper();

    const actionButton = wrapper.find('[data-testid="action-button"]');

    expect(actionButton.exists()).toBe(true);
    expect(actionButton.attributes('aria-label')).toBe('More actions for setting - password-min-length');
  });

  it('a11y: action menu aria-label should include different setting id', () => {
    const wrapper = createWrapper({ id: 'server-url' });

    const actionButton = wrapper.find('[data-testid="action-button"]');

    expect(actionButton.attributes('aria-label')).toBe('More actions for setting - server-url');
  });

  it('should not render action menu when hasActions is false', () => {
    const wrapper = createWrapper({ hasActions: false });

    const actionButton = wrapper.find('[data-testid="action-button"]');

    expect(actionButton.exists()).toBe(false);
  });

  it('should show "Set by Environment Variable" badge when fromEnv is true', () => {
    const wrapper = createWrapper({ fromEnv: true });

    const envLabel = wrapper.find('[data-testid^="advanced-setting-env-label"]');

    expect(envLabel.exists()).toBe(true);
    expect(envLabel.text()).toBe('Set by Environment Variable');
  });

  it('should show "Modified" badge when customized is true', () => {
    const wrapper = createWrapper({ customized: true });

    const modifiedBadge = wrapper.find('.modified');

    expect(modifiedBadge.exists()).toBe(true);
    expect(modifiedBadge.text()).toBe('Modified');
  });
});
