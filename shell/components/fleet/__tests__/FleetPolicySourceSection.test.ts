import { shallowMount, VueWrapper } from '@vue/test-utils';
import FleetPolicySourceSection from '@shell/components/fleet/FleetPolicySourceSection.vue';
import FleetPolicyAllowList from '@shell/components/fleet/FleetPolicyAllowList.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _CREATE } from '@shell/config/query-params';

describe('component: FleetPolicySourceSection', () => {
  const mountSection = (props = {}) => shallowMount(FleetPolicySourceSection, {
    props: {
      value: {}, variant: 'gitRepo', mode: _CREATE, ...props
    },
    global: { stubs: { RcSection: { template: '<div><slot /></div>' } } },
  });

  const selectWithTestid = (wrapper: VueWrapper<any>, testid: string) => {
    const select = wrapper.findAllComponents(LabeledSelect).find((s) => s.attributes('data-testid') === testid);

    if (!select) {
      throw new Error(`no select rendered with data-testid "${ testid }"`);
    }

    return select;
  };

  it('should write the GitRepo secret fields under their GitRepo names', async() => {
    const value = {};
    const wrapper = mountSection({ value });

    await selectWithTestid(wrapper, 'fleet-policy-git-repo-default-secret').vm.$emit('update:value', 'tenant-1-git-credentials');

    expect(value).toStrictEqual({ defaultClientSecretName: 'tenant-1-git-credentials' });
  });

  it('should write the HelmOp secret fields under their HelmOp names', async() => {
    const value = {};
    const wrapper = mountSection({ value, variant: 'helmOp' });

    await selectWithTestid(wrapper, 'fleet-policy-helm-op-default-secret').vm.$emit('update:value', 'tenant-1-helm-credentials');

    expect(value).toStrictEqual({ defaultHelmSecretName: 'tenant-1-helm-credentials' });
  });

  it('should only show the allow-list once the user restricts the secrets', async() => {
    const wrapper = mountSection();

    expect(wrapper.findComponent(FleetPolicyAllowList).exists()).toBe(false);

    await wrapper.setProps({ restricted: true });

    expect(wrapper.findComponent(FleetPolicyAllowList).exists()).toBe(true);
  });

  it('should clear the allow-list when the user goes back to allowing all', async() => {
    const value = { allowedClientSecretNames: ['tenant-1-git-credentials'] };
    const wrapper = mountSection({ value, restricted: true });

    await wrapper.setProps({ restricted: false });

    expect(value.allowedClientSecretNames).toStrictEqual([]);
  });

  it('should offer the secret options to both the default and the allow-list', () => {
    const secretOptions = ['tenant-1-git-credentials', 'tenant-2-git-credentials'];
    const wrapper = mountSection({ secretOptions, restricted: true });

    expect(selectWithTestid(wrapper, 'fleet-policy-git-repo-default-secret').props('options')).toStrictEqual(secretOptions);
    expect(wrapper.findComponent(FleetPolicyAllowList).props('options')).toStrictEqual(secretOptions);
  });
});
