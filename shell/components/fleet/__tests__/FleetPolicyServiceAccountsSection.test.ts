import { shallowMount, VueWrapper } from '@vue/test-utils';
import FleetPolicyServiceAccountsSection from '@shell/components/fleet/FleetPolicyServiceAccountsSection.vue';
import FleetPolicyAllowList from '@shell/components/fleet/FleetPolicyAllowList.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { _CREATE } from '@shell/config/query-params';

const REQUIRE_SERVICE_ACCOUNT = 'fleet-policy-require-service-account';
const ALLOW_NAMESPACE_CREATION = 'fleet-policy-allow-namespace-creation';

describe('component: FleetPolicyServiceAccountsSection', () => {
  const mountSection = (props = {}) => shallowMount(FleetPolicyServiceAccountsSection, {
    props: {
      value: {}, mode: _CREATE, ...props
    },
    global: { stubs: { RcSection: { template: '<div><slot /></div>' } } },
  });

  const testid = (id: string) => `[data-testid="${ id }"]`;

  const checkbox = (wrapper: VueWrapper<any>, id: string) => {
    const box = wrapper.findAllComponents(Checkbox).find((c) => c.attributes('data-testid') === id);

    if (!box) {
      throw new Error(`no checkbox rendered with data-testid "${ id }"`);
    }

    return box;
  };

  it('should require a service account only when the user asks for it', async() => {
    const value: Record<string, any> = {};
    const wrapper = mountSection({ value });

    expect(value.requireServiceAccount).toBeUndefined();

    await checkbox(wrapper, REQUIRE_SERVICE_ACCOUNT).vm.$emit('update:value', true);

    expect(value.requireServiceAccount).toBe(true);
  });

  it('should hide the namespace creation option while no service account is required', () => {
    const wrapper = mountSection();

    expect(wrapper.find(testid(ALLOW_NAMESPACE_CREATION)).exists()).toBe(false);
  });

  it('should offer the namespace creation option once a service account is required', () => {
    const wrapper = mountSection({ value: { requireServiceAccount: true } });

    expect(wrapper.find(testid(ALLOW_NAMESPACE_CREATION)).exists()).toBe(true);
    expect(wrapper.find(testid('fleet-policy-namespace-creation-docs-link')).attributes('href'))
      .toContain('explanations/multi-tenancy#_namespace_creation');
  });

  it('should allow namespace creation when the user asks for it', async() => {
    const value: Record<string, any> = { requireServiceAccount: true };
    const wrapper = mountSection({ value });

    await checkbox(wrapper, ALLOW_NAMESPACE_CREATION).vm.$emit('update:value', true);

    expect(value.allowNamespaceCreation).toBe(true);
  });

  // Fleet unions the field across the namespace, so a value left behind would weaken another policy
  it('should stop allowing namespace creation when the requirement is dropped', async() => {
    const value: Record<string, any> = { requireServiceAccount: true, allowNamespaceCreation: true };
    const wrapper = mountSection({ value });

    await checkbox(wrapper, REQUIRE_SERVICE_ACCOUNT).vm.$emit('update:value', false);

    expect(value.allowNamespaceCreation).toBe(false);
  });

  it('should only show the allow-list once the user restricts the service accounts', async() => {
    const wrapper = mountSection();

    expect(wrapper.findComponent(FleetPolicyAllowList).exists()).toBe(false);

    await wrapper.setProps({ restricted: true });

    expect(wrapper.findComponent(FleetPolicyAllowList).exists()).toBe(true);
  });

  it('should clear the allowed service accounts when the user goes back to allowing all', async() => {
    const value = { allowedServiceAccounts: ['tenant-1-deployer'] };
    const wrapper = mountSection({ value, restricted: true });

    await wrapper.setProps({ restricted: false });

    expect(value.allowedServiceAccounts).toStrictEqual([]);
  });
});
