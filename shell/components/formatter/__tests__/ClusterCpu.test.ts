import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ClusterCpu from '@shell/components/formatter/ClusterCpu.vue';

const mountWith = (row: Record<string, unknown>) => mount(ClusterCpu, {
  props:  { row },
  global: { plugins: [createStore({})] },
});

describe('component: ClusterCpu', () => {
  it('should show the allocatable cores of a management cluster', () => {
    expect(mountWith({ status: { allocatable: { cpu: '4' } } }).text()).toContain('4');
  });

  it('should read through to the management cluster when given a provisioning one', () => {
    expect(mountWith({ mgmt: { status: { allocatable: { cpu: '6' } } } }).text()).toContain('6');
  });

  it('should show a dash when nothing has been reported', () => {
    expect(mountWith({}).text()).toBe('—');
  });
});
