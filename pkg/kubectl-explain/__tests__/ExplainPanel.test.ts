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

const POD_ID = 'io.k8s.api.core.v1.Pod';
const DEPLOYMENT_ID = 'io.k8s.api.apps.v1.Deployment';

// `data()` types `expanded` as an empty object, so reach for it through `any`.
const mountPanel = (definition: any, expandAll = false, definitionId = POD_ID): any => shallowMount(ExplainPanel, {
  props: {
    definition, expandAll, definitionId
  }
});

describe('component: ExplainPanel', () => {
  it('expands and collapses a field on demand', () => {
    const wrapper = mountPanel(podDefinition);

    wrapper.vm.expand('spec');
    expect(wrapper.vm.expanded.spec).toBe(true);

    wrapper.vm.expand('spec');
    expect(wrapper.vm.expanded.spec).toBe(false);
  });

  it('collapses expanded fields when a different type is shown', async() => {
    const wrapper = mountPanel(podDefinition);

    wrapper.vm.expand('spec');
    expect(wrapper.vm.expanded.spec).toBe(true);

    // Expansion is keyed by field name, so Pod's open 'spec' would otherwise
    // leave Deployment's 'spec' open too.
    await wrapper.setProps({ definition: deploymentDefinition, definitionId: DEPLOYMENT_ID });

    expect(wrapper.vm.expanded).toStrictEqual({});
  });

  it('keeps expanded fields when the same type is rebuilt', async() => {
    const wrapper = mountPanel(podDefinition);

    wrapper.vm.expand('spec');

    // Navigating re-runs expandOpenAPIDefinition, which rebuilds every
    // definition object. Same type, so the user's expansion should survive.
    await wrapper.setProps({ definition: JSON.parse(JSON.stringify(podDefinition)) });

    expect(wrapper.vm.expanded.spec).toBe(true);
  });

  it('names inline types by position and named types by their ref', () => {
    const wrapper = mountPanel(podDefinition);

    expect(wrapper.vm.fieldTypeId({ name: 'spec', $refName: 'io.k8s.api.core.v1.PodSpec' }))
      .toStrictEqual('io.k8s.api.core.v1.PodSpec');
    expect(wrapper.vm.fieldTypeId({ name: 'spec' })).toStrictEqual(`${ POD_ID }.spec`);
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
