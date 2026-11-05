import { shallowMount } from '@vue/test-utils';
import { nextTick, reactive } from 'vue';
import NetworkPolicy from '@shell/edit/networking.k8s.io.networkpolicy/index.vue';
import MatchExpressions from '@shell/components/form/MatchExpressions.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { KubeLabelSelector } from '@shell/types/kube/kube-api';

jest.mock('@shell/utils/selector-typed', () => ({
  matching: jest.fn().mockResolvedValue({
    matched: 0, matches: [], none: true, sample: null, total: 0
  })
}));

type NetworkPolicyValue = { metadata: { namespace: string }, spec?: { policyTypes: string[], podSelector: KubeLabelSelector } };

const mountNetworkPolicy = (value: NetworkPolicyValue, mode = _CREATE) => shallowMount(NetworkPolicy, {
  props:  { value, mode },
  global: {
    mocks: {
      $store: {
        getters: {
          'i18n/t':              (key: string) => key,
          'type-map/headersFor': () => [],
          'cluster/schemaFor':   () => ({}),
          currentProduct:        { inStore: 'cluster' },
        }
      },
      $route: { query: {}, name: 'c-cluster-product-resource-create' },
    },
    stubs: {
      CruResource: { template: '<div><slot /></div>' },
      Tabbed:      { template: '<div><slot /></div>' },
      Tab:         { template: '<div><slot /></div>' },
    },
  },
});

describe('edit: networking.k8s.io.networkpolicy', () => {
  it('should save each Selectors rule once', async() => {
    const value = reactive<NetworkPolicyValue>({ metadata: { namespace: 'default' } });
    const wrapper = mountNetworkPolicy(value);

    wrapper.findComponent(MatchExpressions).vm.$emit('update:value', [
      {
        key: 'aaa', operator: 'In', values: ['aaa']
      },
      {
        key: 'bbb', operator: 'In', values: ['bbb']
      },
    ]);
    await nextTick();

    expect(value.spec?.podSelector).toStrictEqual({ matchLabels: { aaa: 'aaa', bbb: 'bbb' }, matchExpressions: [] });
  });

  it('should leave the pod selector of the policy being edited unchanged', async() => {
    const podSelector = (): KubeLabelSelector => ({
      matchLabels:      { aaa: 'aaa' },
      matchExpressions: [{
        key: 'aaa', operator: 'In', values: ['bbb']
      }],
    });
    const value = reactive<NetworkPolicyValue>({ metadata: { namespace: 'default' }, spec: { policyTypes: [], podSelector: podSelector() } });

    mountNetworkPolicy(value, _EDIT);
    await nextTick();

    expect(value.spec?.podSelector).toStrictEqual(podSelector());
  });
});
