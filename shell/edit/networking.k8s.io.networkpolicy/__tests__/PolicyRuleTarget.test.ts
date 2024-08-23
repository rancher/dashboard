import { mount } from '@vue/test-utils';
import PolicyRuleTarget from '@shell/edit/networking.k8s.io.networkpolicy/PolicyRuleTarget';
import mock from '@shell/edit/networking.k8s.io.networkpolicy/__tests__/utils/mock.json';
import { PolicyRuleTargetSelectors } from '@shell/edit/networking.k8s.io.networkpolicy/__tests__/utils/selectors.test.ts';

type MatchData = {
  matched: number;
  matches: Array<object>;
  none: boolean;
  total: number;
  sample?: string;
}

const newNamespace = {
  id:       'new-namespace',
  type:     'namespace',
  kind:     'Namespace',
  spec:     { finalizers: ['kubernetes'] },
  status:   { phase: 'Active' },
  metadata: {
    annotations:       { user: 'john' },
    name:              'default',
    creationTimestamp: '2024-01-31T10:24:03Z',
    fields:            ['default', 'Active', '1d'],
    labels:            { user: 'john' },
    relationships:     null,
    resourceVersion:   '1',
    state:             {
      error:         false,
      message:       '',
      name:          'active',
      transitioning: false
    }
  }
};

describe.each([
  'view',
  'edit',
])('component: PolicyRuleTarget', (mode) => {
  const mockExists = jest.fn().mockReturnValue(true);

  const wrapper = mount(PolicyRuleTarget, {
    data() {
      return { throttleTime: 0 };
    },
    props: {
      namespace:     mock.defaultNamespace,
      allNamespaces: mock.allNamespaces,
      allPods:       mock.allPods,
      type:          'ingress',
      mode
    },
    global: {
      mocks: {
        $store: {
          getters: {
            'i18n/exists': mockExists,
            'i18n/t':      (key: string, matchData: MatchData) => matchData ? `${ key }-${ matchData.total }` : key,
          }
        }
      },
    }
  });

  describe(`${ mode } mode`, () => {
    it('should display ip-block selector rule', async() => {
      const ipBlock = mock.selectors.ipBlock;

      await wrapper.setProps({ value: { ipBlock } });

      const selectors = new PolicyRuleTargetSelectors(wrapper);

      // Check rule type selector
      expect(wrapper.vm.targetType).toBe('ipBlock');

      expect(selectors.namespace.exists()).toBe(false);
      expect(selectors.pod.exists()).toBe(false);
      expect(selectors.namespaceAndPod.namespaceRule.exists()).toBe(false);
      expect(selectors.namespaceAndPod.podRule.exists()).toBe(false);

      expect(selectors.ipBlock.element._value).toStrictEqual(ipBlock.cidr);
    });

    it('should display namespace selector rule', async() => {
      const namespaceSelector = mock.selectors.namespace;

      await wrapper.setProps({ value: { namespaceSelector } });

      const selectors = new PolicyRuleTargetSelectors(wrapper);

      // Check rule type selector
      expect(wrapper.vm.targetType).toBe('namespaceSelector');

      // Check the matching namespaces displayed by the banner
      expect(wrapper.vm.$data.matchingNamespaces.matched).toBe(1);

      // Check if namespace's labels match
      expect(wrapper.vm.$data.matchingNamespaces.matches).toHaveLength(1);
      expect(wrapper.vm.$data.matchingNamespaces.matches[0].metadata.name).toBe('default');
      expect(wrapper.vm.$data.matchingNamespaces.matches[0].metadata.labels['user']).toBe('alice');

      expect(selectors.pod.exists()).toBe(false);
      expect(selectors.namespaceAndPod.namespaceRule.exists()).toBe(false);
      expect(selectors.namespaceAndPod.podRule.exists()).toBe(false);

      expect(selectors.namespace.element).toBeDefined();

      // Updating allNamespace should update the matching namespaces message too
      await wrapper.setProps({
        allNamespaces: [
          ...wrapper.vm.$props.allNamespaces,
          newNamespace
        ]
      });

      const expectedTotal = 3;

      expect(wrapper.vm.$data.matchingNamespaces.total).toBe(expectedTotal);
    });

    it('should display pod selector rule', async() => {
      const podSelector = mock.selectors.pod;

      await wrapper.setProps({ value: { podSelector } });

      const selectors = new PolicyRuleTargetSelectors(wrapper);

      // Check rule type selector
      expect(wrapper.vm.targetType).toBe('podSelector');

      // Check if namespace's labels match
      expect(wrapper.vm.$data.matchingPods.matched).toBe(1);
      expect(wrapper.vm.$data.matchingPods.matches).toHaveLength(1);

      expect(wrapper.vm.$data.matchingPods.matches[0].metadata.name).toBe('test-pod');
      expect(wrapper.vm.$data.matchingPods.matches[0].metadata.labels['foo']).toBe('bar');

      expect(selectors.namespace.exists()).toBe(false);
      expect(selectors.namespaceAndPod.namespaceRule.exists()).toBe(false);
      expect(selectors.namespaceAndPod.podRule.exists()).toBe(false);

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
      expect(wrapper.vm.targetType).toBe('namespaceAndPodSelector');

      // Check the matching pods displayed by the banner
      expect(wrapper.vm.$data.matchingPods.matched).toBe(1);

      // Check if namespace's labels match
      expect(wrapper.vm.$data.matchingNamespaces.matches).toHaveLength(1);
      expect(wrapper.vm.$data.matchingNamespaces.matches[0].metadata.name).toBe('default');
      expect(wrapper.vm.$data.matchingNamespaces.matches[0].metadata.labels['user']).toBe('alice');

      expect(wrapper.vm.$data.matchingPods.matches[0].metadata.name).toBe('test-pod');
      expect(wrapper.vm.$data.matchingPods.matches[0].metadata.labels['foo']).toBe('bar');

      expect(selectors.namespace.exists()).toBe(false);
      expect(selectors.pod.exists()).toBe(false);

      expect(selectors.namespaceAndPod.namespaceRule.element).toBeDefined();
      expect(selectors.namespaceAndPod.podRule.element).toBeDefined();
    });
  });
});
