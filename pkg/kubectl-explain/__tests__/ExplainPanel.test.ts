import { shallowMount } from '@vue/test-utils';
import ExplainPanel from '@pkg/kubectl-explain/components/ExplainPanel.vue';

const podDefinition = {
  properties: {
    kind: { type: 'string' },
    spec: {
      $refName: 'io.k8s.api.core.v1.PodSpec',
      $$ref:    { properties: { containers: { type: 'array' } } },
    },
  },
};

const deploymentDefinition = {
  properties: {
    kind: { type: 'string' },
    spec: {
      $refName: 'io.k8s.api.apps.v1.DeploymentSpec',
      $$ref:    { properties: { replicas: { type: 'integer' } } },
    },
  },
};

// `data()` types `expanded` as an empty object, so reach for it through `any`.
const mountPanel = (definition: any, expandAll = false): any => shallowMount(ExplainPanel, { props: { definition, expandAll } });

describe('component: ExplainPanel', () => {
  it('expands and collapses a field on demand', () => {
    const wrapper = mountPanel(podDefinition);

    wrapper.vm.expand('spec');
    expect(wrapper.vm.expanded.spec).toBe(true);

    wrapper.vm.expand('spec');
    expect(wrapper.vm.expanded.spec).toBe(false);
  });

  it('collapses expanded fields when a different definition is shown', async() => {
    const wrapper = mountPanel(podDefinition);

    wrapper.vm.expand('spec');
    expect(wrapper.vm.expanded.spec).toBe(true);

    // Expansion is keyed by field name, so Pod's open 'spec' would otherwise
    // leave Deployment's 'spec' open too.
    await wrapper.setProps({ definition: deploymentDefinition });

    expect(wrapper.vm.expanded).toStrictEqual({});
  });

  it('expands every expandable field when mounted with expandAll', () => {
    const wrapper = mountPanel(podDefinition, true);

    expect(wrapper.vm.expanded).toStrictEqual({ spec: true });
  });

  it('expands and collapses every expandable field when expandAll is toggled', async() => {
    const wrapper = mountPanel(podDefinition);

    await wrapper.setProps({ expandAll: true });
    expect(wrapper.vm.expanded).toStrictEqual({ spec: true });

    await wrapper.setProps({ expandAll: false });
    expect(wrapper.vm.expanded).toStrictEqual({ spec: false });
  });
});
