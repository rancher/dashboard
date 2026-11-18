import EKSValidators, { CruEKSContext } from '../validators';

const mockTranslation = (key: string) => key;

describe('validate EKS Cluster name', () => {
  it('should return an error if norman cluster name is an empty string or undefined', () => {
    const ctx = {
      normanCluster: { name: '' },
      t:             mockTranslation,
    } as any as CruEKSContext;

    const res = EKSValidators.clusterNameRequired(ctx)();

    expect(res).toBeDefined();
  });

  it('should not return an error if norman cluster name  is defined', () => {
    const ctx = {
      normanCluster: { name: 'abc' },
      t:             mockTranslation,
    } as any as CruEKSContext;

    const res = EKSValidators.clusterNameRequired(ctx)();

    expect(res).toBeNull();
  });
});

describe('validate EKS node group names', () => {
  it('should return an error if the current node name is empty', () => {
    const ctx = {
      nodeGroups: [],
      t:          mockTranslation,
    } as any as CruEKSContext;

    const res = EKSValidators.nodeGroupNamesRequired(ctx)('');

    expect(res).toBeDefined();
  });

  it('should not return an error if the current node name is defined', () => {
    const ctx = {
      nodeGroups: [],
      t:          mockTranslation,
    } as any as CruEKSContext;

    const res = EKSValidators.nodeGroupNamesRequired(ctx)('abc');

    expect(res).toBeDefined();
  });

  it('should flag only the node groups that have no name', () => {
    const ctx = {
      nodeGroups: [{ nodegroupName: '' }, { nodegroupName: 'abc' }],
      t:          mockTranslation,
    } as any as CruEKSContext;

    EKSValidators.nodeGroupNamesRequired(ctx)(undefined);

    expect(ctx.nodeGroups.map((group) => group.__nameRequired)).toStrictEqual([false, undefined]);
  });

  it('should clear the flag once a node group is named', () => {
    const ctx = {
      nodeGroups: [{ nodegroupName: '' }],
      t:          mockTranslation,
    } as any as CruEKSContext;

    EKSValidators.nodeGroupNamesRequired(ctx)(undefined);
    ctx.nodeGroups[0].nodegroupName = 'abc';

    expect(EKSValidators.nodeGroupNamesRequired(ctx)(undefined)).toBeNull();
    expect(ctx.nodeGroups[0].__nameRequired).toBeUndefined();
  });

  it.each([
    [{
      nodeGroups: [{ nodegroupName: 'abc' }, { nodegroupName: 'def' }],
      t:          mockTranslation,
    } as any as CruEKSContext, null],
    [{
      nodeGroups: [{ nodegroupName: 'abc' }, { nodegroupName: '' }],
      t:          mockTranslation,
    } as any as CruEKSContext, 'validation.required'],
  ])('should validate that all node groups have names if not passed a specific node group', (ctx, expected) => {
    const res = EKSValidators.nodeGroupNamesRequired(ctx)(undefined);

    expect(res).toBe(expected);
  });

  it.each([
    [{
      nodeGroups: [{ nodegroupName: 'abc' }, { nodegroupName: 'def' }],
      t:          mockTranslation,
    } as any as CruEKSContext, null],
    [{
      nodeGroups: [{ nodegroupName: 'abc' }, { nodegroupName: 'abc' }, { nodegroupName: 'def' }],
      t:          mockTranslation,
    } as any as CruEKSContext, 'eks.errors.nodeGroups.nameUnique'],
    [{
      nodeGroups: [{ nodegroupName: '' }, { nodegroupName: '' }],
      t:          mockTranslation,
    } as any as CruEKSContext, null],
    [{
      nodeGroups: [],
      t:          mockTranslation,
    } as any as CruEKSContext, null]
  ])('should return an error if any node group within ctx has a non-unique name, ignoring unnamed groups', (ctx, expected) => {
    const res = EKSValidators.nodeGroupNamesUnique(ctx)();

    expect(res).toBe(expected);
  });

  it('should flag only the node groups sharing a name', () => {
    const ctx = {
      nodeGroups: [{ nodegroupName: 'abc' }, { nodegroupName: 'abc' }, { nodegroupName: 'def' }],
      t:          mockTranslation,
    } as any as CruEKSContext;

    EKSValidators.nodeGroupNamesUnique(ctx)();

    expect(ctx.nodeGroups.map((group) => group.__nameUnique)).toStrictEqual([false, false, undefined]);
  });

  it('should clear the flag once a duplicate name is corrected', () => {
    const ctx = {
      nodeGroups: [{ nodegroupName: 'abc' }, { nodegroupName: 'abc' }],
      t:          mockTranslation,
    } as any as CruEKSContext;

    EKSValidators.nodeGroupNamesUnique(ctx)();
    ctx.nodeGroups[1].nodegroupName = 'def';

    expect(EKSValidators.nodeGroupNamesUnique(ctx)()).toBeNull();
    expect(ctx.nodeGroups.every((group) => group.__nameUnique === undefined)).toBe(true);
  });
});

describe('validate EKS node group desired size', () => {
  it('should return an error if the desired size is less than the minimum size', () => {
    const ctx = {
      config: { },
      t:      mockTranslation,
    } as any as CruEKSContext;

    const res = EKSValidators.minMaxDesired(ctx)({
      minSize: 2, desiredSize: 1, maxSize: 2
    });

    expect(res).toBeDefined();
  });

  it('should return an error if the desired size is greater than the maximum size', () => {
    const ctx = {
      config: { },
      t:      mockTranslation,
    } as any as CruEKSContext;

    const res = EKSValidators.minMaxDesired(ctx)({
      minSize: 1, desiredSize: 3, maxSize: 2
    });

    expect(res).toBeDefined();
  });

  it('should not return an error if the desired size is equal to the minimum and maximum sizes', () => {
    const ctx = {
      config: { },
      t:      mockTranslation,
    } as any as CruEKSContext;

    const res = EKSValidators.minMaxDesired(ctx)({
      minSize: 1, desiredSize: 1, maxSize: 1
    });

    expect(res).toBeUndefined();
  });

  it.each([
    [[{
      minSize: 1, desiredSize: 1, maxSize: 1
    }, {
      minSize: 1, desiredSize: 3, maxSize: 1
    }], 'eks.errors.minMaxDesired'],
    [[{
      minSize: 1, desiredSize: 1, maxSize: 1
    }, {
      minSize: 1, desiredSize: 3, maxSize: 4
    }], undefined]
  ])('should validate each node group in the component context if not called with specific size arguments', (nodeGroups, errMsg) => {
    const ctx = {
      config: { },
      t:      mockTranslation,
      nodeGroups
    } as any as CruEKSContext;

    const res = EKSValidators.minMaxDesired(ctx)();

    expect(res).toBe(errMsg);
  });
});

describe('validate EKS node group minimum and maximum size', () => {
  it('should return an error if the minimum size is greater than the maximum size', () => {
    const ctx = {
      config: { },
      t:      mockTranslation,
    } as any as CruEKSContext;

    const res = EKSValidators.minLessThanMax(ctx)({ minSize: 2, maxSize: 1 });

    expect(res).toBe('eks.errors.minLessThanMax');
  });

  it('should not return an error if the minimum and maximum sizes are equal', () => {
    const ctx = {
      config: { },
      t:      mockTranslation,
    } as any as CruEKSContext;

    const res = EKSValidators.minLessThanMax(ctx)({ minSize: 2, maxSize: 2 });

    expect(res).toBeUndefined();
  });

  it.each([
    [[{ minSize: 1, maxSize: 1 }, { minSize: 3, maxSize: 1 }], 'eks.errors.minLessThanMax'],
    [[{ minSize: 1, maxSize: 1 }, { minSize: 1, maxSize: 4 }], undefined]
  ])('should validate each node group in the component context if not called with specific size arguments', (nodeGroups, errMsg) => {
    const ctx = {
      config: { },
      t:      mockTranslation,
      nodeGroups
    } as any as CruEKSContext;

    const res = EKSValidators.minLessThanMax(ctx)();

    expect(res).toBe(errMsg);
  });

  it('should return an error if the minimum size is less than 0', () => {
    const ctx = {
      config: { },
      t:      mockTranslation,
    } as any as CruEKSContext;

    let res = EKSValidators.minSize(ctx)(-1);

    expect(res).toBe('eks.errors.atLeastZero');

    res = EKSValidators.minSize(ctx)(0);

    expect(res).toBeNull();

    res = EKSValidators.minSize(ctx)(1);

    expect(res).toBeNull();
  });

  it.each([
    [[{ minSize: 1 }, { }], 'eks.errors.atLeastZero'],
    [[{ minSize: 0 }, { minSize: -1 }], 'eks.errors.atLeastZero'],
    [[{ minSize: 0 }, { minSize: 1 }], null]
  ])('should return an error if any node pools have a minimum size less than 0', (nodeGroups, errMsg) => {
    const ctx = {
      config: { },
      t:      mockTranslation,
      nodeGroups
    } as any as CruEKSContext;

    const res = EKSValidators.minSize(ctx)();

    expect(res).toBe(errMsg);
  });
});
