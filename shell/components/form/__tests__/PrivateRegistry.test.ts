import { shallowMount } from '@vue/test-utils';
import { createStore, Store } from 'vuex';
import PrivateRegistry from '@shell/components/form/PrivateRegistry.vue';
import { PRIVATE_REGISTRY_CONTEXT } from '@shell/components/form/PrivateRegistry.constants';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret.vue';
import Banner from '@components/Banner/Banner.vue';
import { SETTING } from '@shell/config/settings';

const buildStore = (settings: Record<string, any> = {}): Store<any> => {
  return createStore({
    getters: {
      'i18n/t':          () => (text: string) => text,
      t:                 () => (text: string) => text,
      'management/byId': () => (_type: string, id: string) => {
        if (id === SETTING.SYSTEM_DEFAULT_REGISTRY && settings.registry) {
          return { value: settings.registry };
        }
        if (id === SETTING.SYSTEM_DEFAULT_REGISTRY_PULL_SECRETS && settings.pullSecrets) {
          return { value: settings.pullSecrets };
        }

        return null;
      },
    },
  });
};

const mountPrivateRegistry = (props = {}, storeSettings: Record<string, any> = {}) => {
  const store = buildStore(storeSettings);

  return shallowMount(PrivateRegistry, {
    props: {
      mode: 'edit',
      ...props
    },
    global: {
      plugins: [store],
      mocks:   { $store: store }
    }
  });
};

describe('privateRegistry', () => {
  describe('basic rendering', () => {
    it('should render the info banner', () => {
      const wrapper = mountPrivateRegistry();
      const banners = wrapper.findAllComponents(Banner);

      expect(banners.some((b) => b.props('color') === 'info')).toBe(true);
    });

    it('should render the enable checkbox', () => {
      const wrapper = mountPrivateRegistry();
      const checkbox = wrapper.findComponent(Checkbox);

      expect(checkbox.exists()).toBe(true);
    });

    it('should not show the URL input when no value is provided', () => {
      const wrapper = mountPrivateRegistry();

      expect(wrapper.findComponent(LabeledInput).exists()).toBe(false);
    });

    it('should show the URL input when a value is provided', () => {
      const wrapper = mountPrivateRegistry({ value: 'registry.example.com' });

      expect(wrapper.findComponent(LabeledInput).exists()).toBe(true);
    });
  });

  describe('enable/disable toggle', () => {
    it('should show the URL input when checkbox is checked', async() => {
      const wrapper = mountPrivateRegistry();

      expect(wrapper.findComponent(LabeledInput).exists()).toBe(false);

      const checkbox = wrapper.findComponent(Checkbox);

      await checkbox.vm.$emit('update:value', true);
      await wrapper.vm.$nextTick();

      expect(wrapper.findComponent(LabeledInput).exists()).toBe(true);
    });

    it('should emit update:value with undefined when checkbox is unchecked', async() => {
      const wrapper = mountPrivateRegistry({ value: 'registry.example.com' });
      const checkbox = wrapper.findComponent(Checkbox);

      await checkbox.vm.$emit('update:value', false);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:value')).toHaveLength(1);
      expect(wrapper.emitted('update:value')![0]).toStrictEqual([undefined]);
    });

    it('should emit update:pullSecret with undefined when checkbox is unchecked', async() => {
      const wrapper = mountPrivateRegistry({ value: 'registry.example.com' });
      const checkbox = wrapper.findComponent(Checkbox);

      await checkbox.vm.$emit('update:value', false);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:pullSecret')).toHaveLength(1);
      expect(wrapper.emitted('update:pullSecret')![0]).toStrictEqual([undefined]);
    });

    it('should auto-enable the checkbox when value changes from null to a string', async() => {
      const wrapper = mountPrivateRegistry();

      expect(wrapper.findComponent(LabeledInput).exists()).toBe(false);

      await wrapper.setProps({ value: 'registry.example.com' });

      expect(wrapper.findComponent(LabeledInput).exists()).toBe(true);
    });

    it('should sync showInput when enabled prop changes', async() => {
      const wrapper = mountPrivateRegistry({ enabled: false });

      expect(wrapper.findComponent(LabeledInput).exists()).toBe(false);

      await wrapper.setProps({ enabled: true });

      expect(wrapper.findComponent(LabeledInput).exists()).toBe(true);
    });
  });

  describe('URL input', () => {
    it('should emit update:value when the URL input changes', async() => {
      const wrapper = mountPrivateRegistry({ value: 'registry.example.com' });
      const input = wrapper.findComponent(LabeledInput);

      await input.vm.$emit('update:value', 'new-registry.example.com');

      expect(wrapper.emitted('update:value')).toHaveLength(1);
      expect(wrapper.emitted('update:value')![0]).toStrictEqual(['new-registry.example.com']);
    });

    it('should pass rules to the URL input', () => {
      const mockRule = jest.fn();
      const wrapper = mountPrivateRegistry({
        value: 'registry.example.com',
        rules: [mockRule]
      });
      const input = wrapper.findComponent(LabeledInput);

      expect(input.props('rules')).toBeDefined();
    });

    it('should use globalRegistry from store as fallback value', async() => {
      const wrapper = mountPrivateRegistry(
        {},
        { registry: 'global.registry.io' }
      );

      // Toggle checkbox to show input without setting value
      const checkbox = wrapper.findComponent(Checkbox);

      await checkbox.vm.$emit('update:value', true);
      await wrapper.vm.$nextTick();

      const input = wrapper.findComponent(LabeledInput);

      expect(input.props('value')).toBe('global.registry.io');
    });

    it('should use defaultRegistry prop over store setting', async() => {
      const wrapper = mountPrivateRegistry(
        { defaultRegistry: 'prop.registry.io' },
        { registry: 'store.registry.io' }
      );

      const checkbox = wrapper.findComponent(Checkbox);

      await checkbox.vm.$emit('update:value', true);
      await wrapper.vm.$nextTick();

      const input = wrapper.findComponent(LabeledInput);

      expect(input.props('value')).toBe('prop.registry.io');
    });
  });

  describe('data-testid', () => {
    it('should apply custom data-testid to checkbox when provided', () => {
      const wrapper = mountPrivateRegistry({ checkboxTestId: 'my-checkbox' });
      const checkbox = wrapper.findComponent(Checkbox);

      expect(checkbox.attributes('data-testid')).toBe('my-checkbox');
    });

    it('should apply custom data-testid to input when provided', () => {
      const wrapper = mountPrivateRegistry({
        value:       'registry.example.com',
        inputTestId: 'my-input'
      });
      const input = wrapper.findComponent(LabeledInput);

      expect(input.attributes('data-testid')).toBe('my-input');
    });

    it('should not set data-testid when not provided', () => {
      const wrapper = mountPrivateRegistry({ value: 'registry.example.com' });
      const checkbox = wrapper.findComponent(Checkbox);
      const input = wrapper.findComponent(LabeledInput);

      expect(checkbox.attributes('data-testid')).toBeUndefined();
      expect(input.attributes('data-testid')).toBeUndefined();
    });
  });

  describe('pull secrets section', () => {
    it('should show SelectOrCreateAuthSecret when showPullSecrets is true and value is provided', () => {
      const wrapper = mountPrivateRegistry({
        value:           'registry.example.com',
        showPullSecrets: true
      });

      expect(wrapper.findComponent(SelectOrCreateAuthSecret).exists()).toBe(true);
    });

    it('should not show SelectOrCreateAuthSecret when showPullSecrets is false', () => {
      const wrapper = mountPrivateRegistry({
        value:           'registry.example.com',
        showPullSecrets: false
      });

      expect(wrapper.findComponent(SelectOrCreateAuthSecret).exists()).toBe(false);
    });

    it('should not show SelectOrCreateAuthSecret when no value is provided', () => {
      const wrapper = mountPrivateRegistry({ showPullSecrets: true });

      expect(wrapper.findComponent(SelectOrCreateAuthSecret).exists()).toBe(false);
    });

    it('should pass noneLabel to SelectOrCreateAuthSecret when provided', () => {
      const wrapper = mountPrivateRegistry({
        value:     'registry.example.com',
        noneLabel: 'Custom none label'
      });
      const selector = wrapper.findComponent(SelectOrCreateAuthSecret);

      expect(selector.props('noneLabel')).toBe('Custom none label');
    });

    it('should emit update:pullSecret when SelectOrCreateAuthSecret emits update:value', async() => {
      const wrapper = mountPrivateRegistry({
        value:           'registry.example.com',
        showPullSecrets: true
      });
      const selector = wrapper.findComponent(SelectOrCreateAuthSecret);

      await selector.vm.$emit('update:value', 'my-secret');

      expect(wrapper.emitted('update:pullSecret')).toHaveLength(1);
      expect(wrapper.emitted('update:pullSecret')![0]).toStrictEqual(['my-secret']);
    });
  });

  describe('default pull secrets', () => {
    it('should load default pull secrets from repoDefaultPullSecrets prop', async() => {
      const wrapper = mountPrivateRegistry({
        value:                  'registry.example.com',
        repoDefaultPullSecrets: ['repo-secret-1']
      });

      await wrapper.vm.$nextTick();
      const selector = wrapper.findComponent(SelectOrCreateAuthSecret);

      expect(selector.props('noneLabel')).toContain('catalog.chart.registry.pullSecret.defaultLabel');
    });

    it('should load default pull secrets from store setting when repoDefaultPullSecrets is empty', async() => {
      const wrapper = mountPrivateRegistry(
        {
          value:                  'registry.example.com',
          repoDefaultPullSecrets: []
        },
        { pullSecrets: 'store-secret-1' }
      );

      await wrapper.vm.$nextTick();
      const selector = wrapper.findComponent(SelectOrCreateAuthSecret);

      expect(selector.props('noneLabel')).toContain('catalog.chart.registry.pullSecret.defaultLabel');
    });

    it('should prefer repoDefaultPullSecrets over store setting', async() => {
      const wrapper = mountPrivateRegistry(
        {
          value:                  'registry.example.com',
          repoDefaultPullSecrets: ['repo-secret']
        },
        { pullSecrets: 'store-secret' }
      );

      await wrapper.vm.$nextTick();
      const selector = wrapper.findComponent(SelectOrCreateAuthSecret);

      // The label should reference the repo default, not the store one
      expect(selector.props('noneLabel')).toContain('repo-secret');
    });

    it('should use generic default label when multiple default pull secrets exist', async() => {
      const wrapper = mountPrivateRegistry({
        value:                  'registry.example.com',
        repoDefaultPullSecrets: ['secret-1', 'secret-2']
      });

      await wrapper.vm.$nextTick();
      const selector = wrapper.findComponent(SelectOrCreateAuthSecret);

      expect(selector.props('noneLabel')).toBe('catalog.chart.registry.pullSecret.defaultLabelGeneric');
    });

    it('should show defaults banner when multiple default pull secrets exist', async() => {
      const wrapper = mountPrivateRegistry({
        value:                  'registry.example.com',
        repoDefaultPullSecrets: ['secret-1', 'secret-2']
      });

      await wrapper.vm.$nextTick();
      const banners = wrapper.findAllComponents(Banner).filter((b) => b.props('color') === 'info');

      // Should have at least the description banner + the defaults banner
      expect(banners.length).toBeGreaterThanOrEqual(2);
    });

    it('should not show defaults banner when only one default pull secret exists', () => {
      const wrapper = mountPrivateRegistry({
        value:                  'registry.example.com',
        repoDefaultPullSecrets: ['single-secret']
      });
      const banners = wrapper.findAllComponents(Banner).filter((b) => b.props('color') === 'info');

      // Only the description banner
      expect(banners).toHaveLength(1);
    });
  });

  describe('existing values pull secrets', () => {
    it('should show existing values banner when multiple existing pull secrets are provided', () => {
      const wrapper = mountPrivateRegistry({
        value:                     'registry.example.com',
        existingValuesPullSecrets: ['existing-1', 'existing-2']
      });
      const banners = wrapper.findAllComponents(Banner).filter((b) => b.props('color') === 'info');

      // Description banner + existing values banner
      expect(banners.length).toBeGreaterThanOrEqual(2);
    });

    it('should hide SelectOrCreateAuthSecret when multiple existing pull secrets are provided', () => {
      const wrapper = mountPrivateRegistry({
        value:                     'registry.example.com',
        existingValuesPullSecrets: ['existing-1', 'existing-2']
      });

      expect(wrapper.findComponent(SelectOrCreateAuthSecret).exists()).toBe(false);
    });

    it('should show SelectOrCreateAuthSecret when only one existing pull secret is provided', () => {
      const wrapper = mountPrivateRegistry({
        value:                     'registry.example.com',
        existingValuesPullSecrets: ['single-existing']
      });

      expect(wrapper.findComponent(SelectOrCreateAuthSecret).exists()).toBe(true);
    });

    it('should show existing values banner instead of defaults banner when both have multiple', () => {
      const wrapper = mountPrivateRegistry({
        value:                     'registry.example.com',
        existingValuesPullSecrets: ['existing-1', 'existing-2'],
        repoDefaultPullSecrets:    ['default-1', 'default-2']
      });
      // Existing values banner takes priority, defaults banner hidden
      const banners = wrapper.findAllComponents(Banner).filter((b) => b.props('color') === 'info');

      // Description banner + existing values banner (not defaults banner)
      expect(banners).toHaveLength(2);
    });
  });

  describe('skip pull secrets', () => {
    it('should show skip checkbox only for charts context', () => {
      const wrapper = mountPrivateRegistry({
        value:   'registry.example.com',
        context: PRIVATE_REGISTRY_CONTEXT.CHARTS
      });
      const checkboxes = wrapper.findAllComponents(Checkbox);
      const skipCheckbox = checkboxes.find((c) => c.props('label') === 'catalog.chart.registry.pullSecret.skipOption');

      expect(skipCheckbox?.exists()).toBe(true);
    });

    it('should not show skip checkbox for provisioning context', () => {
      const wrapper = mountPrivateRegistry({
        value:   'registry.example.com',
        context: PRIVATE_REGISTRY_CONTEXT.PROVISIONING
      });
      const checkboxes = wrapper.findAllComponents(Checkbox);
      const skipCheckbox = checkboxes.find((c) => c.props('label') === 'catalog.chart.registry.pullSecret.skipOption');

      expect(skipCheckbox).toBeUndefined();
    });

    it('should hide SelectOrCreateAuthSecret when skip is enabled', async() => {
      const wrapper = mountPrivateRegistry({
        value:   'registry.example.com',
        context: PRIVATE_REGISTRY_CONTEXT.CHARTS
      });
      const checkboxes = wrapper.findAllComponents(Checkbox);
      const skipCheckbox = checkboxes.find((c) => c.props('label') === 'catalog.chart.registry.pullSecret.skipOption');

      await skipCheckbox!.vm.$emit('update:value', true);
      await wrapper.vm.$nextTick();

      expect(wrapper.findComponent(SelectOrCreateAuthSecret).exists()).toBe(false);
    });

    it('should emit update:skipPullSecrets when skip checkbox changes', async() => {
      const wrapper = mountPrivateRegistry({
        value:   'registry.example.com',
        context: PRIVATE_REGISTRY_CONTEXT.CHARTS
      });
      const checkboxes = wrapper.findAllComponents(Checkbox);
      const skipCheckbox = checkboxes.find((c) => c.props('label') === 'catalog.chart.registry.pullSecret.skipOption');

      await skipCheckbox!.vm.$emit('update:value', true);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:skipPullSecrets')).toHaveLength(1);
      expect(wrapper.emitted('update:skipPullSecrets')![0]).toStrictEqual([true]);
    });

    it('should emit update:pullSecret with undefined when skip is enabled', async() => {
      const wrapper = mountPrivateRegistry({
        value:   'registry.example.com',
        context: PRIVATE_REGISTRY_CONTEXT.CHARTS
      });
      const checkboxes = wrapper.findAllComponents(Checkbox);
      const skipCheckbox = checkboxes.find((c) => c.props('label') === 'catalog.chart.registry.pullSecret.skipOption');

      await skipCheckbox!.vm.$emit('update:value', true);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:pullSecret')).toHaveLength(1);
      expect(wrapper.emitted('update:pullSecret')![0]).toStrictEqual([undefined]);
    });

    it('should sync localSkipPullSecrets when skipPullSecrets prop changes', async() => {
      const wrapper = mountPrivateRegistry({
        value:           'registry.example.com',
        context:         PRIVATE_REGISTRY_CONTEXT.CHARTS,
        skipPullSecrets: false
      });

      expect(wrapper.findComponent(SelectOrCreateAuthSecret).exists()).toBe(true);

      await wrapper.setProps({ skipPullSecrets: true });

      expect(wrapper.findComponent(SelectOrCreateAuthSecret).exists()).toBe(false);
    });

    it('should hide banners when skip is enabled', async() => {
      const wrapper = mountPrivateRegistry({
        value:                  'registry.example.com',
        context:                PRIVATE_REGISTRY_CONTEXT.CHARTS,
        repoDefaultPullSecrets: ['secret-1', 'secret-2']
      });

      await wrapper.vm.$nextTick();

      const bannersBefore = wrapper.findAllComponents(Banner).filter((b) => b.props('color') === 'info');

      expect(bannersBefore.length).toBeGreaterThanOrEqual(2);

      const checkboxes = wrapper.findAllComponents(Checkbox);
      const skipCheckbox = checkboxes.find((c) => c.props('label') === 'catalog.chart.registry.pullSecret.skipOption');

      await skipCheckbox!.vm.$emit('update:value', true);
      await wrapper.vm.$nextTick();

      const bannersAfter = wrapper.findAllComponents(Banner).filter((b) => b.props('color') === 'info');

      // Only the description banner should remain
      expect(bannersAfter).toHaveLength(1);
    });
  });

  describe('pullSecret watcher', () => {
    it('should emit update:value with globalRegistry when pullSecret is set and no value exists', async() => {
      const wrapper = mountPrivateRegistry(
        { showPullSecrets: true },
        { registry: 'global.registry.io' }
      );

      await wrapper.setProps({ pullSecret: 'my-secret' });

      const emitted = wrapper.emitted('update:value');

      expect(emitted).toBeTruthy();
      expect(emitted![emitted!.length - 1]).toStrictEqual(['global.registry.io']);
    });

    it('should emit update:value with undefined when pullSecret is cleared and value equals globalRegistry', async() => {
      const wrapper = mountPrivateRegistry(
        {
          value:           'global.registry.io',
          pullSecret:      'my-secret',
          showPullSecrets: true
        },
        { registry: 'global.registry.io' }
      );

      await wrapper.setProps({ pullSecret: undefined });

      const emitted = wrapper.emitted('update:value');

      expect(emitted).toBeTruthy();
      expect(emitted![emitted!.length - 1]).toStrictEqual([undefined]);
    });
  });
});
