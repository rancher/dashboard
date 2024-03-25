import { mount } from '@vue/test-utils';
import PolicyRuleTarget from '@shell/edit/networking.k8s.io.networkpolicy/PolicyRuleTarget';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';
import mock from '@shell/edit/networking.k8s.io.networkpolicy/__tests__/utils/mock.json';
import { PolicyRuleTargetSelectors } from '@shell/edit/networking.k8s.io.networkpolicy/__tests__/utils/selectors.test.ts';

describe.each([
  'view',
  'edit',
])('component: PolicyRuleTarget', (mode) => {
  const mockExists = jest.fn().mockReturnValue(true);
  const mockT = jest.fn().mockReturnValue('some-string');

  const wrapper = mount(PolicyRuleTarget, {
    data() {
      return { throttleTime: 0 };
    },
    propsData: {
      namespace:     mock.defaultNamespace,
      allNamespaces: mock.allNamespaces,
      allPods:       mock.allPods,
      type:          'ingress',
      mode
    },

    directives: { cleanHtmlDirective },

    mocks: {
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
      const ipBlock = mock.selectors.ipBlock;

      await wrapper.setProps({ value: { ipBlock } });

      const selectors = new PolicyRuleTargetSelectors(wrapper);

      // Check rule type selector
      expect(selectors.ruleType.vm.$data._value.value).toBe('ipBlock');

      expect(selectors.namespace.element).toBeUndefined();
      expect(selectors.pod.element).toBeUndefined();
      expect(selectors.namespaceAndPod.namespaceRule.element).toBeUndefined();
      expect(selectors.namespaceAndPod.podRule.element).toBeUndefined();

      expect(selectors.ipBlock.element._value).toStrictEqual(ipBlock.cidr);
    });

    it('should display namespace selector rule', async() => {
      const namespaceSelector = mock.selectors.namespace;

      await wrapper.setProps({ value: { namespaceSelector } });

      const selectors = new PolicyRuleTargetSelectors(wrapper);

      // Check rule type selector
      expect(selectors.ruleType.vm.$data._value.value).toBe('namespaceSelector');

      // Check the matching namespaces displayed by the banner
      expect(wrapper.vm.$data.matchingNamespaces.matched).toBe(1);

      // Check if namespace's labels match
      expect(wrapper.vm.$data.matchingNamespaces.matches).toHaveLength(1);
      expect(wrapper.vm.$data.matchingNamespaces.matches[0].metadata.name).toBe('default');
      expect(wrapper.vm.$data.matchingNamespaces.matches[0].metadata.labels['user']).toBe('alice');

      expect(selectors.pod.element).toBeUndefined();
      expect(selectors.namespaceAndPod.namespaceRule.element).toBeUndefined();
      expect(selectors.namespaceAndPod.podRule.element).toBeUndefined();

      expect(selectors.namespace.element).toBeDefined();
    });

    it('should display pod selector rule', async() => {
      const podSelector = mock.selectors.pod;

      await wrapper.setProps({ value: { podSelector } });

      const selectors = new PolicyRuleTargetSelectors(wrapper);

      // Check rule type selector
      expect(selectors.ruleType.vm.$data._value.value).toBe('podSelector');

      // Check if namespace's labels match
      expect(wrapper.vm.$data.matchingPods.matched).toBe(1);
      expect(wrapper.vm.$data.matchingPods.matches).toHaveLength(1);

      expect(wrapper.vm.$data.matchingPods.matches[0].metadata.name).toBe('test-pod');
      expect(wrapper.vm.$data.matchingPods.matches[0].metadata.labels['foo']).toBe('bar');

      expect(selectors.namespace.element).toBeUndefined();
      expect(selectors.namespaceAndPod.namespaceRule.element).toBeUndefined();
      expect(selectors.namespaceAndPod.podRule.element).toBeUndefined();

      expect(selectors.pod.element).toBeDefined();
    });

    it('should display namespace/pod selector rule', async() => {
      const namespaceSelector = mock.selectors.namespaceAndPod.namespace;
      const podSelector = mock.selectors.namespaceAndPod.pod;

      await wrapper.setProps({
        value: {
          namespaceSelector,
          podSelector,
        }
      });

      const selectors = new PolicyRuleTargetSelectors(wrapper);

      // Check rule type selector
      expect(selectors.ruleType.vm.$data._value.value).toBe('namespaceAndPodSelector');

      // Check the matching pods displayed by the banner
      expect(wrapper.vm.$data.matchingPods.matched).toBe(1);

      // Check if namespace's labels match
      expect(wrapper.vm.$data.matchingNamespaces.matches).toHaveLength(1);
      expect(wrapper.vm.$data.matchingNamespaces.matches[0].metadata.name).toBe('default');
      expect(wrapper.vm.$data.matchingNamespaces.matches[0].metadata.labels['user']).toBe('alice');

      expect(wrapper.vm.$data.matchingPods.matches[0].metadata.name).toBe('test-pod');
      expect(wrapper.vm.$data.matchingPods.matches[0].metadata.labels['foo']).toBe('bar');

      expect(selectors.namespace.element).toBeUndefined();
      expect(selectors.pod.element).toBeUndefined();

      expect(selectors.namespaceAndPod.namespaceRule.element).toBeDefined();
      expect(selectors.namespaceAndPod.podRule.element).toBeDefined();
    });
  });
});
