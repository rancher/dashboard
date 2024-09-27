import ProjectRow from '@shell/components/form/ResourceQuota/ProjectRow.vue';
import { RANCHER_TYPES } from '@shell/components/form/ResourceQuota/shared';
import { shallowMount } from '@vue/test-utils';

const CONFIGMAP_STRING = RANCHER_TYPES[0].value;

describe('component: ProjectRow.vue', () => {
  const wrapper = shallowMount(ProjectRow,
    {
      props: {
        mode:  'edit',
        types: RANCHER_TYPES,
        type:  CONFIGMAP_STRING,
        value: {
          spec: {
            namespaceDefaultResourceQuota: { limit: {} },
            resourceQuota:                 { limit: {} }
          }
        }
      }
    });

  it('should render the correct input fields and set the correct computed values, based on the provided data', () => {
    const typeInput = wrapper.find(`[data-testid="projectrow-type-input"]`);
    const projectQuotaInput = wrapper.find(`[data-testid="projectrow-project-quota-input"]`);
    const namespaceQuotaInput = wrapper.find(`[data-testid="projectrow-namespace-quota-input"]`);

    expect(typeInput.exists()).toBe(true);
    expect(projectQuotaInput.exists()).toBe(true);
    expect(namespaceQuotaInput.exists()).toBe(true);
    expect(wrapper.vm.resourceQuotaLimit).toStrictEqual({});
    expect(wrapper.vm.namespaceDefaultResourceQuotaLimit).toStrictEqual({});
  });

  it('triggering "updateQuotaLimit" should trigger Vue.set with the correct data', () => {
    wrapper.vm.updateQuotaLimit('resourceQuota', CONFIGMAP_STRING, 10);

    expect(wrapper.vm.value).toStrictEqual({
      spec: {
        namespaceDefaultResourceQuota: { limit: {} },
        resourceQuota:                 { limit: { [`${ CONFIGMAP_STRING }`]: 10 } }
      }
    });
  });

  it('triggering "updateType" with the same type that existed should clear limits and trigger emit', () => {
    wrapper.vm.updateType(CONFIGMAP_STRING);

    expect(wrapper.vm.value).toStrictEqual({
      spec: {
        namespaceDefaultResourceQuota: { limit: {} },
        resourceQuota:                 { limit: {} }
      }
    });

    expect(wrapper.emitted('type-change')).toBeTruthy();
    expect(wrapper.emitted('type-change')[0]).toStrictEqual([CONFIGMAP_STRING]);
  });
});
