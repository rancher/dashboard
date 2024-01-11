import * as validators from '@pkg/aks/util/validators';

validators.requiredTranslation = (ctx, label) => `${ label } is required.`;

validators.needsValidation = () => true;

const mockCtx = { normanCluster: { }, t: () => 'abc' };

describe('fx: requiredInCluster', () => {
  it('returns an error message containing the field label if field is not defined in cluster', () => {
    const mockCtx = { normanCluster: {} };
    const testLabel = 'test-label';

    const validator = validators.requiredInCluster(mockCtx, testLabel, 'spec');

    expect(validator()).toStrictEqual(`${ testLabel } is required.`);
  });

  it('returns undefined if field is defined in cluster', () => {
    const mockCtx = { normanCluster: { spec: 'abc' } };
    const testLabel = 'test-label';

    const validator = validators.requiredInCluster(mockCtx, testLabel, 'spec');

    expect(validator()).toBeUndefined();
  });
});

describe('fx: clusterNameChars', () => {
  it.each([
    ['!!abc!!', 'abc'],
    ['123aBc-_', undefined]]
  )('returns an error message if the cluster name contains anything other than alphanumerics, underscores, or hyphens', (name, validatorMsg) => {
    const ctx = { ...mockCtx, normanCluster: { name } };

    const validator = validators.clusterNameChars(ctx);

    expect(validator()).toStrictEqual(validatorMsg);
  });
});

describe('fx: clusterNameStartEnd', () => {
  it.each([
    ['!!abc!!', 'abc'],
    ['123abc-_', 'abc'],
    ['-abc', 'abc'],
    ['a-_b', undefined]
  ])('returns an error message if the cluster name starts or ends with anything other than alphanumeric', (name, validatorMsg) => {
    const ctx = { ...mockCtx, normanCluster: { name } };

    const validator = validators.clusterNameStartEnd(ctx);

    expect(validator()).toStrictEqual(validatorMsg);
  });
});
