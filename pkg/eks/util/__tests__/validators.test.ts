import EKSValidators, { CruEKSContext } from '../validators';

const mockTranslation = (key: string) => key;

describe('validate EKS Cluster name', () => {
  it('should return an error if displayName is an empty string or undefined', () => {
    const ctx = {
      config:          { displayName: '' },
      t:               mockTranslation,
      needsValidation: true
    } as any as CruEKSContext;

    const res = EKSValidators.clusterNameRequired(ctx)();

    expect(res).toBeDefined();
  });

  it('should not return an error if name is defined', () => {
    const ctx = {
      config:          { displayName: 'abc' },
      t:               mockTranslation,
      needsValidation: true
    } as any as CruEKSContext;

    const res = EKSValidators.clusterNameRequired(ctx)();

    expect(res).toBeNull();
  });
});

describe('validate EKS node group names', () => {
  it('should return an error if the current node name is empty', () => {
    const ctx = {
      nodeGroups:      [],
      t:               mockTranslation,
      needsValidation: true
    } as any as CruEKSContext;

    const res = EKSValidators.nodeGroupNamesRequired(ctx)('');

    expect(res).toBeDefined();
  });

  it('should not return an error if the current node name is defined', () => {
    const ctx = {
      nodeGroups:      [],
      t:               mockTranslation,
      needsValidation: true
    } as any as CruEKSContext;

    const res = EKSValidators.nodeGroupNamesRequired(ctx)('abc');

    expect(res).toBeDefined();
  });

  it.each([
    [{
      nodeGroups:      [{ nodegroupName: 'abc' }, { nodegroupName: 'def' }],
      t:               mockTranslation,
      needsValidation: true
    } as any as CruEKSContext, null],
    [{
      nodeGroups:      [{ nodegroupName: 'abc' }, { nodegroupName: '' }],
      t:               mockTranslation,
      needsValidation: true
    } as any as CruEKSContext, 'validation.required'],
  ])('should validate that all node groups have names if not passed a specific node group', (ctx, expected) => {
    const res = EKSValidators.nodeGroupNamesRequired(ctx)(undefined);

    expect(res).toBe(expected);
  });

  it.each([
    [{
      nodeGroups:      [{ nodegroupName: 'abc' }, { nodegroupName: 'def' }],
      t:               mockTranslation,
      needsValidation: true
    } as any as CruEKSContext, 'abc', null],
    [{
      nodeGroups:      [{ nodegroupName: 'abc' }, { nodegroupName: 'abc' }, { nodegroupName: 'def' }],
      t:               mockTranslation,
      needsValidation: true
    } as any as CruEKSContext, 'abc', 'eks.errors.nodeGroups.nameUnique'],
    [{
      nodeGroups:      [{ nodegroupName: 'abc' }, { nodegroupName: 'abc' }, { nodegroupName: 'def' }],
      t:               mockTranslation,
      needsValidation: true
    } as any as CruEKSContext, 'def', null],
  ])('should return an error if the node group name passed in is not unique within ctx', (ctx, nodeGroupName, expected) => {
    const res = EKSValidators.nodeGroupNamesUnique(ctx)(nodeGroupName);

    expect(res).toBe(expected);
  });

  it.each([
    [{
      nodeGroups:      [{ nodegroupName: 'abc' }, { nodegroupName: 'def' }],
      t:               mockTranslation,
      needsValidation: true,
      $set:            () => {}
    } as any as CruEKSContext, null],
    [{
      nodeGroups:      [{ nodegroupName: 'abc' }, { nodegroupName: 'abc' }, { nodegroupName: 'def' }],
      t:               mockTranslation,
      needsValidation: true,
      $set:            () => {}
    } as any as CruEKSContext, 'eks.errors.nodeGroups.nameUnique']
  ])('should return an error if any node group within ctx has non-unique name, if not passed a name', (ctx, expected) => {
    const res = EKSValidators.nodeGroupNamesUnique(ctx)(undefined);

    expect(res).toBe(expected);
  });
});
