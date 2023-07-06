import Node from '@shell/list/node.vue';
import { COLUMN_BREAKPOINTS } from '@shell/components/SortableTable/index.vue';

describe('component: list/node', () => {
  it('should contains cpu and memory header', () => {
    const localThis = { canViewPods: false, COLUMN_BREAKPOINTS };
    const a = ['cpu', 'ram'];
    const h = Node.computed.headers.call(localThis).filter(item => a.includes(item.name));

    expect(h).toHaveLength(2);
    expect(h.find(item => item.name === 'cpu').formatter).toBe('CpuUsage');
    expect(h.find(item => item.name === 'ram').formatter).toBe('MemoryUsage');
  });
});
