import { mount } from '@vue/test-utils';
import PolicyRuleTarget from '../PolicyRuleTarget.vue';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';

class Selectors {
  private wrapper;

  constructor(wrapper) {
    this.wrapper = wrapper;
  }

  get ipBlock() {
    return this.wrapper.find('[data-testid=labeled-input-ip-block-selector]');
  }

  /**
   * Namespace selector element; matches policies in OR condition, in conjunction with the other rules
   */
  get namespace() {
    return this.wrapper.find('[data-testid=match-expression-namespace-selector]');
  }

  /**
   * Pod selector element; matches policies in OR condition, in conjunction with the other rules
   */
  get pod() {
    return this.wrapper.find('[data-testid=match-expression-pod-selector]');
  }

  /**
   * Namespace and pod selector elements, matching policies in AND condition, within the same rule
   */
  get namespaceAndPod() {
    return {
      namespaceRule: this.wrapper.find('[data-testid=match-expression-namespace-and-pod-selector-ns-rule]'),
      podRule:       this.wrapper.find('[data-testid=match-expression-namespace-and-pod-selector-pod-rule]'),
    };
  }

  get ruleType() {
    return this.wrapper.find('[data-testid=labeled-select-type-selector]');
  }
}

describe.each([
  'view',
  'edit',
])('component: PolicyRuleTarget', (mode) => {
  const mockExists = jest.fn().mockReturnValue(true);
  const mockT = jest.fn().mockReturnValue('some-string');

  const wrapper = mount(PolicyRuleTarget, {
    propsData: {
      type:      'ingress',
      namespace: 'default',
      mode
    },
    directives: { cleanHtmlDirective },
    mocks:      {
      $store: {
        getters: {
          'i18n/exists': mockExists,
          'i18n/t':      mockT
        }
      }
    }
  });

  describe(`${ mode } mode`, () => {
    it('should display ip-block selector rule', async() => {
      const ipBlock = { cidr: '24.06.19.89/0' };

      await wrapper.setProps({ value: { ipBlock } });

      const selectors = new Selectors(wrapper);

      expect(selectors.ruleType.vm.$data._value.value).toBe('ipBlock');

      expect(selectors.namespace.element).toBeUndefined();
      expect(selectors.pod.element).toBeUndefined();
      expect(selectors.namespaceAndPod.namespaceRule.element).toBeUndefined();
      expect(selectors.namespaceAndPod.podRule.element).toBeUndefined();
      expect(selectors.ipBlock.element._value).toStrictEqual(ipBlock.cidr);
    });

    it('should display namespace selector rule', async() => {
      const namespaceSelector = {
        matchLabels:      { foo: 'bar' },
        matchExpressions: [{
          key: 'foo', operator: 'In', values: 'bar'
        }]
      };

      await wrapper.setProps({ value: { namespaceSelector } });

      const selectors = new Selectors(wrapper);

      expect(selectors.ruleType.vm.$data._value.value).toBe('namespaceSelector');
      expect(selectors.pod.element).toBeUndefined();
      expect(selectors.namespaceAndPod.namespaceRule.element).toBeUndefined();
      expect(selectors.namespaceAndPod.podRule.element).toBeUndefined();
      expect(selectors.namespace.vm.$data.rules).toStrictEqual(namespaceSelector.matchExpressions);
    });

    it('should display pod selector rule', async() => {
      const podSelector = {
        matchLabels:      { foo: 'bar' },
        matchExpressions: [{
          key: 'foo', operator: 'In', values: 'bar'
        }]
      };

      await wrapper.setProps({ value: { podSelector } });

      const selectors = new Selectors(wrapper);

      expect(selectors.ruleType.vm.$data._value.value).toBe('podSelector');
      expect(selectors.namespace.element).toBeUndefined();
      expect(selectors.namespaceAndPod.namespaceRule.element).toBeUndefined();
      expect(selectors.namespaceAndPod.podRule.element).toBeUndefined();
      expect(selectors.pod.vm.$data.rules).toStrictEqual(podSelector.matchExpressions);
    });

    it('should display namespace/pod selector rule', async() => {
      const namespaceSelector = {
        matchLabels:      { namespaceFoo: 'namespaceBar' },
        matchExpressions: [
          {
            key: 'namespaceFoo', operator: 'In', values: 'namespaceBar'
          }
        ]
      };

      const podSelector = {
        matchLabels:      { podFoo: 'podBar' },
        matchExpressions: [
          {
            key: 'podFoo', operator: 'In', values: 'podBar'
          }
        ]
      };

      await wrapper.setProps({
        value: {
          namespaceSelector,
          podSelector,
        }
      });

      const selectors = new Selectors(wrapper);

      expect(selectors.ruleType.vm.$data._value.value).toBe('namespaceAndPodSelector');

      expect(selectors.namespace.element).toBeUndefined();
      expect(selectors.pod.element).toBeUndefined();

      expect(selectors.namespaceAndPod.namespaceRule.vm.$data.rules).toStrictEqual(namespaceSelector.matchExpressions);
      expect(selectors.namespaceAndPod.podRule.vm.$data.rules).toStrictEqual(podSelector.matchExpressions);
    });
  });
});
