import { shallowMount } from '@vue/test-utils';
import LocaleSelector from '@shell/components/LocaleSelector.vue';

// mapGetters checks store._modulesNamespaceMap to verify the namespace exists
// before reading getters, so that internal property must be present in the mock.
const storeMock = {
  getters: {
    'i18n/selectedLocaleLabel': 'English',
    'i18n/availableLocales':    { 'en-us': 'English', 'zh-hans': '简体中文' },
  },
  _modulesNamespaceMap: { 'i18n/': {} },
};

// RcDropdown wraps the trigger in its default slot. The shallowMount stub for
// RcDropdown does not render slots by default, so we provide a pass-through
// stub so that RcDropdownTrigger is visible and can be queried.
const rcDropdownPassthrough = { template: '<div><slot /></div>' };

describe('component: LocaleSelector', () => {
  describe('login mode', () => {
    function createWrapper() {
      return shallowMount(LocaleSelector, {
        props:  { mode: 'login' },
        global: {
          mocks: { $store: storeMock },
          stubs: { RcDropdown: rcDropdownPassthrough },
        },
      });
    }

    it('should render the dropdown trigger with aria-label from locale.menu translation', () => {
      const wrapper = createWrapper();
      const trigger = wrapper.find('rc-dropdown-trigger-stub');

      expect(trigger.attributes('aria-label')).toBe('%locale.menu%');
    });

    it('should not include "Locale selector" text in the trigger aria-label', () => {
      const wrapper = createWrapper();
      const trigger = wrapper.find('rc-dropdown-trigger-stub');

      expect(trigger.attributes('aria-label')).not.toContain('Locale selector');
    });
  });
});
