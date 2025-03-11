import { shallowMount } from '@vue/test-utils';
import Import, { GKE_STATES_ENUM } from '@pkg/gke/components/Import.vue';

const mockedData = {
  clustersResponse: {
    clusters: [
      { name: 'test1', status: GKE_STATES_ENUM.RUNNING }, // only running clusters should be displayed
      { name: 'test2', status: GKE_STATES_ENUM.ERROR },
      { name: 'test3', status: GKE_STATES_ENUM.PROVISIONING }
    ]
  }
};

describe('gke import', () => {
  it('should allow only the running GKE clusters to be imported', async() => {
    const wrapper = shallowMount(Import, {
      data() {
        return mockedData;
      }
    });

    expect(wrapper.vm.clusterOptions).toHaveLength(1);
  });

  it('should use a text input if no clusters are found', async() => {
    const wrapper = shallowMount(Import, {
      data() {
        return { clustersResponse: null, loadClusterFailed: true };
      }
    });

    const nameTextInput = wrapper.getComponent('[data-testid="gke-import-cluster-name-text"]');

    expect(nameTextInput.isVisible()).toBe(true);

    nameTextInput.vm.$emit('input', { target: { value: 'abc' } });

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:clusterName')?.[0]?.[0]).toStrictEqual('abc');
  });
});
