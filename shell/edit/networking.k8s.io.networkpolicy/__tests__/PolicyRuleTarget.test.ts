import { mount } from '@vue/test-utils';
import PolicyRuleTarget from '@shell/edit/networking.k8s.io.networkpolicy/PolicyRuleTarget';
import mock from '@shell/edit/networking.k8s.io.networkpolicy/__tests__/utils/mock.json';
import { PolicyRuleTargetSelectors } from '@shell/edit/networking.k8s.io.networkpolicy/__tests__/utils/selectors.test.ts';
import { nextTick } from 'vue';
import { COUNT, NAMESPACE, POD } from '@shell/config/types';

type MatchData = {
  matched: number;
  matches: Array<object>;
  none: boolean;
  total: number;
  sample?: string;
}

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
      namespace: mock.defaultNamespace,
      type:      'ingress',
      mode
    },
    global: {
      mocks: {
        $store: {
          dispatch: (action: string, { type }: { type: string}) => {
            switch (action) {
            case 'cluster/findAll':
              switch (type) {
              case NAMESPACE:
                return mock.allNamespaces;
              case POD:
                return mock.allPods;
              default:
                throw new Error(`unknown type ${ type }`);
              }
            default:
              throw new Error(`unknown action ${ action }`);
            }
          },
          getters: {
            'i18n/exists':  mockExists,
            'i18n/t':       (key: string, matchData: MatchData) => matchData ? `${ key }-${ matchData.total }` : key,
            currentProduct: { inStore: 'cluster' },
            'cluster/all':  (type: string) => {
              switch (type) {
              case COUNT:
                return mock.counts;
              default:
                throw new Error(`unknown type ${ type }`);
              }
            },
            'cluster/findAll': ({ type }: {type: string}) => {
              switch (type) {
              case NAMESPACE:
                return mock.allNamespaces;
              case POD:
                return mock.allPods;
              default:
                throw new Error(`unknown type ${ type }`);
              }
            },
            'cluster/schemaFor': (type: string) => {
              switch (type) {
              case NAMESPACE:
                return { attributes: { namespaced: false } };
              case POD:
                return { attributes: { namespaced: true } };
              default:
                throw new Error(`unknown type ${ type }`);
              }
            }
          }
        }
      },
    }
  });

  describe(`${ mode } mode`, () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    const waitForUpdatedMatched = async() => {
      jest.advanceTimersByTime(1000); // Wait for debounced call to fetch updated cluster list
      await nextTick(); // Wait for changes to cluster list to trigger changes
    };

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
      // This test needs improving - mock data needs to contain more than applicable to selector
      const namespaceSelector = mock.selectors.namespace;

      await wrapper.setProps({ value: { namespaceSelector } });

      const selectors = new PolicyRuleTargetSelectors(wrapper);

      // Check rule type selector
      expect(wrapper.vm.targetType).toBe('namespaceSelector');

      // Check the matching namespaces displayed by the banner
      expect(wrapper.vm.$data.matchingNamespaces.matched).toBe(0);

      await wrapper.vm.updateMatches();
      await waitForUpdatedMatched();

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
    });

    it('should display pod selector rule', async() => {
      // This test needs improving - mock data needs to contain more than applicable to selector
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
