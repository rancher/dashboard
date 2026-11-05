import { mount } from '@vue/test-utils';
import ClusterMemory from '@shell/components/formatter/ClusterMemory.vue';

const mountWith = (row: Record<string, unknown>) => mount(ClusterMemory, { props: { row } });

describe('component: ClusterMemory', () => {
  it('should format the allocatable memory of a management cluster', () => {
    expect(mountWith({ status: { allocatable: { memory: '16Gi' } } }).text()).toContain('GiB');
  });

  it('should read through to the management cluster when given a provisioning one', () => {
    expect(mountWith({ mgmt: { status: { allocatable: { memory: '8Gi' } } } }).text()).toContain('GiB');
  });

  it('should show a dash rather than a zero when nothing has been reported', () => {
    expect(mountWith({}).text()).toBe('—');
  });
});
