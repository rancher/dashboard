import { GKEInitialCount } from '../validators';

const mockTranslation = (key: string) => key;

describe('validate GKE node group initial count', () => {
  it.each([
    [-1, 'gke.errors.initialNodeCount'],
    [0, null],
    [2, null],
    [1000, null],
    [1001, 'gke.errors.initialNodeCount']
  ])('should return an error if the initial node count is less than 0 or greater than 1000', (count, errMsg) => {
    const ctx = {
      config:          { },
      t:               mockTranslation,
      isAuthenticated: true
    } as any;

    const res = GKEInitialCount(ctx)(count);

    expect(res).toBe(errMsg);
  });

  it.each([
    [[{ initialNodeCount: -1 }], 'gke.errors.initialNodeCount'],
    [[{ initialNodeCount: 0 }, { initialNodeCount: 1 }], null],
    [[{ initialNodeCount: 1000 }, { initialNodeCount: 1 }], null],
    [[{ initialNodeCount: 1001 }, { initialNodeCount: 1 }], 'gke.errors.initialNodeCount']

  ])('should validate each node group in the component context if not called with a specific count value', (nodePools, errMsg) => {
    const ctx = {
      config:          { },
      t:               mockTranslation,
      nodePools,
      isAuthenticated: true
    } as any;

    const res = GKEInitialCount(ctx)();

    expect(res).toBe(errMsg);
  });
});
