import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ClusterExplore from '@shell/components/formatter/ClusterExplore.vue';

const mountWith = (row: Record<string, unknown>) => mount(ClusterExplore, {
  props:  { row },
  global: {
    plugins: [createStore({})],
    stubs:   { RouterLink: true },
  },
});

describe('component: ClusterExplore', () => {
  it('should link to the cluster when it can be explored', () => {
    const wrapper = mountWith({ id: 'c-m-abc', canExplore: true });
    const button = wrapper.find('[data-testid="cluster-manager-list-explore-management"]');

    expect(button.exists()).toBe(true);
    expect(wrapper.find('[data-testid="cluster-manager-list-explore"]').exists()).toBe(false);
  });

  it('should offer a disabled button when the cluster cannot be explored', () => {
    const wrapper = mountWith({ id: 'c-m-abc', canExplore: false });

    expect(wrapper.find('[data-testid="cluster-manager-list-explore"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="cluster-manager-list-explore-management"]').exists()).toBe(false);
  });
});
