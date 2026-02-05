import ProjectRow from '@shell/components/form/ResourceQuota/ProjectRow.vue';
import { RANCHER_TYPES, TYPES } from '@shell/components/form/ResourceQuota/shared';
import { shallowMount } from '@vue/test-utils';

const CONFIGMAP_STRING = TYPES.CONFIG_MAPS;

describe('component: ProjectRow.vue', () => {
  const defaultMountOptions = {
    props: {
      mode:  'edit',
      types: RANCHER_TYPES,
      type:  CONFIGMAP_STRING,
      index: 0,
      value: {
        spec: {
          namespaceDefaultResourceQuota: { limit: {} },
          resourceQuota:                 { limit: {} }
        }
      }
    }
  };

  it('should render the correct input fields and set the correct computed values, based on the provided data', () => {
    const wrapper = shallowMount(
      ProjectRow,
      { ...defaultMountOptions }
    );

    const typeInput = wrapper.find(`[data-testid="projectrow-type-input"]`);
    const customTypeInput = wrapper.find(`[data-testid="projectrow-custom-type-input"]`);
    const projectQuotaInput = wrapper.find(`[data-testid="projectrow-project-quota-input"]`);
    const namespaceQuotaInput = wrapper.find(`[data-testid="projectrow-namespace-quota-input"]`);

    expect(typeInput.exists()).toBe(true);
    expect(customTypeInput.exists()).toBe(true);
    expect(customTypeInput.attributes().disabled).toBe('true');
    expect(projectQuotaInput.exists()).toBe(true);
    expect(namespaceQuotaInput.exists()).toBe(true);
    expect(wrapper.vm.resourceQuotaLimit).toStrictEqual({});
    expect(wrapper.vm.namespaceDefaultResourceQuotaLimit).toStrictEqual({});
  });

  it('triggering "updateQuotaLimit" should trigger Vue.set with the correct data', () => {
    const wrapper = shallowMount(
      ProjectRow,
      { ...defaultMountOptions }
    );

    wrapper.vm.updateQuotaLimit('resourceQuota', CONFIGMAP_STRING, 10);

    expect(wrapper.vm.value).toStrictEqual({
      spec: {
        namespaceDefaultResourceQuota: { limit: {} },
        resourceQuota:                 { limit: { [`${ CONFIGMAP_STRING }`]: 10 } }
      }
    });
  });

  it('triggering "updateType" with the same type that existed should clear limits and trigger emit', () => {
    const wrapper = shallowMount(
      ProjectRow,
      { ...defaultMountOptions }
    );

    wrapper.vm.updateType(CONFIGMAP_STRING);

    expect(wrapper.vm.value).toStrictEqual({
      spec: {
        namespaceDefaultResourceQuota: { limit: {} },
        resourceQuota:                 { limit: {} }
      }
    });

    expect(wrapper.emitted('type-change')).toBeTruthy();
    expect(wrapper.emitted('type-change')[0]).toStrictEqual([{ index: 0, type: CONFIGMAP_STRING }]);
  });

  it('should update standard resource types', async() => {
    const wrapper = shallowMount(
      ProjectRow,
      { ...defaultMountOptions }
    );

    expect(wrapper.vm.isCustom).toBe(false);

    await wrapper.vm.updateQuotaLimit('resourceQuota', 'limitsCpu', '100m');
    await wrapper.vm.updateQuotaLimit('namespaceDefaultResourceQuota', 'limitsCpu', '50m');

    expect(wrapper.vm.value.spec.resourceQuota.limit.limitsCpu).toBe('100m');
    expect(wrapper.vm.value.spec.namespaceDefaultResourceQuota.limit.limitsCpu).toBe('50m');
    expect(wrapper.vm.value.spec.resourceQuota.limit.extended).toBeUndefined();
  });

  it('should switch to a custom resource type', async() => {
    const wrapper = shallowMount(
      ProjectRow,
      { ...defaultMountOptions }
    );

    await wrapper.vm.updateType(TYPES.EXTENDED);

    expect(wrapper.emitted('type-change')).toHaveLength(1);
    expect(wrapper.emitted('type-change')[0][0]).toStrictEqual({ index: 0, type: TYPES.EXTENDED });
  });

  it('should update custom resource types', async() => {
    const wrapper = shallowMount(
      ProjectRow,
      {
        ...defaultMountOptions,
        props: {
          ...defaultMountOptions.props,
          type: TYPES.EXTENDED
        }
      }
    );

    expect(wrapper.vm.isCustom).toBe(true);

    const customTypeInput = wrapper.find(`[data-testid="projectrow-custom-type-input"]`);

    expect(customTypeInput.attributes().disabled).toBe('false');
    await wrapper.vm.updateCustomType('custom.resource/foo');

    expect(wrapper.vm.customType).toBe('custom.resource/foo');

    await wrapper.vm.updateQuotaLimit('resourceQuota', 'custom.resource/foo', 1);
    await wrapper.vm.updateQuotaLimit('namespaceDefaultResourceQuota', 'custom.resource/foo', 2);

    expect(wrapper.vm.value.spec.resourceQuota.limit.extended['custom.resource/foo']).toBe(1);
    expect(wrapper.vm.value.spec.namespaceDefaultResourceQuota.limit.extended['custom.resource/foo']).toBe(2);
  });

  it('should handle custom resource types with periods', () => {
    const wrapper = shallowMount(ProjectRow, {
      ...defaultMountOptions,
      props: {
        ...defaultMountOptions.props,
        type: 'extended.requests.nvidia.com/gpu'
      }
    });

    expect(wrapper.vm.isCustom).toBe(true);
    expect(wrapper.vm.customType).toBe('requests.nvidia.com/gpu');
  });
});
