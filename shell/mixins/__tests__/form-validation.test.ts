import { mount } from '@vue/test-utils';
import formValidation from '@shell/mixins/form-validation';

describe('form-validation mixin', () => {
  const mockT = (key: string, args?: any) => {
    if (args) {
      return JSON.stringify({ message: key, ...args });
    }

    return key;
  };

  function createComponent(fvFormRuleSets: any[]) {
    const Component = {
      render() {},
      mixins: [formValidation],
      data() {
        return { fvFormRuleSets };
      },
      props: {
        value: {
          type:    Object,
          default: () => ({})
        }
      },
    };

    return mount(Component, {
      props:  { value: {} },
      global: { mocks: { $store: { getters: { 'i18n/t': mockT } } } },
    });
  }

  describe('fvRulesets', () => {
    it('should pass translation keys to formRulesGenerator as "key" option', () => {
      const wrapper = createComponent([{
        path:           'metadata.name',
        rules:          ['required'],
        translationKey: 'generic.name',
      }]);

      const instance = wrapper.vm as any;
      const rulesets = instance.fvRulesets;

      expect(rulesets).toHaveLength(1);
      expect(rulesets[0].path).toStrictEqual('metadata.name');

      // Execute the required rule with a null value
      const requiredRule = rulesets[0].rules[0];
      const result = requiredRule(null);

      // verify that the resulting message uses generic.name not the fallback "Value"
      expect(result).toStrictEqual(JSON.stringify({ message: 'validation.required', key: 'generic.name' }));
    });

    it('should default to using "Value" in error messages when a translation key is not provided', () => {
      const wrapper = createComponent([{
        path:  'metadata.name',
        rules: ['required'],
      }]);

      const instance = wrapper.vm as any;
      const rulesets = instance.fvRulesets;

      const requiredRule = rulesets[0].rules[0];
      const result = requiredRule(null);

      expect(result).toStrictEqual(JSON.stringify({ message: 'validation.required', key: 'Value' }));
    });
  });
});
