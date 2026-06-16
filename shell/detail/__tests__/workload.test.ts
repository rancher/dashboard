import Workload from '@shell/detail/workload/index.vue';

describe('workload detail page', () => {
  it('should not have findMatchingIngresses method (logic moved to workload model)', () => {
    expect(Workload.methods?.findMatchingIngresses).toBeUndefined();
  });
});
