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
});
