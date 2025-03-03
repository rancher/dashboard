import * as validators from '@pkg/aks/util/validators';
import { AKSNodePool } from 'types';

validators.requiredTranslation = (ctx, label) => `${ label } is required.`;

validators.needsValidation = () => true;

const MOCK_TRANSLATION = 'abc';

const mockCtx = {
  normanCluster: { },
  t:             () => MOCK_TRANSLATION,
};

describe('fx: requiredInCluster', () => {
  it('returns an error message containing the field label if field is not defined in cluster', () => {
    const mockCtx = { };
    const testLabel = 'test-label';

    const validator = validators.requiredInCluster(mockCtx, testLabel, 'spec');

    expect(validator()).toStrictEqual(`${ testLabel } is required.`);
  });

  it('returns undefined if field is defined in cluster', () => {
    const mockCtx = { spec: 'abc' } ;
    const testLabel = 'test-label';

    const validator = validators.requiredInCluster(mockCtx, testLabel, 'spec');

    expect(validator()).toBeUndefined();
  });
});

describe('fx: clusterNameChars', () => {
  it.each([
    ['!!abc!!', MOCK_TRANSLATION],
    ['123ac-abd', undefined],
    ['123ac_abd', undefined]
  ])('returns an error message if the cluster name contains anything other than alphanumerics, underscores, or hyphens', (name, validatorMsg) => {
    const ctx = { ...mockCtx, normanCluster: { name } };

    const validator = validators.clusterNameChars(ctx);

    expect(validator()).toStrictEqual(validatorMsg);
  });
});

describe('fx: clusterNameStartEnd', () => {
  it.each([
    ['!!abc!!', MOCK_TRANSLATION],
    ['123abc-_', MOCK_TRANSLATION],
    ['-abc', MOCK_TRANSLATION],
    ['a-_b', undefined]
  ])('returns an error message if the cluster name starts or ends with anything other than alphanumeric', (name, validatorMsg) => {
    const ctx = { ...mockCtx, normanCluster: { name } };

    const validator = validators.clusterNameStartEnd(ctx);

    expect(validator()).toStrictEqual(validatorMsg);
  });
});

describe('fx: resourceGroupChars', () => {
  it.each([
    ['test-test-test', undefined],
    ['abc-DEF123-anc', undefined],
    ['rancher-test-rancher-test-rancher-test-rancher-test-rancher-test-rancher-test-ra!', MOCK_TRANSLATION],
    ['test-####-test', MOCK_TRANSLATION],
  ])('returns an error message if node resource group includes invalid characters', (nodeGroupName, validatorMsg) => {
    const ctx = { ...mockCtx, config: { nodeGroupName } };

    const validator = validators.resourceGroupChars(ctx, '', 'config.nodeGroupName');

    expect(validator()).toStrictEqual(validatorMsg);
  });
});

describe('fx: privateDnsZone', () => {
  it.each([
    ['/subscriptions/abcdef123/resourceGroups/abcdef123/providers/Microsoft.Network/privateDnsZones/test-subzone.private.eastus2.azmk8s.io', undefined],
    ['/subscriptions/abcdef123/resourceGroups/abcdef123/providers/Microsoft.Network/privateDnsZones/test-subzone.privatelink.westus.azmk8s.io', undefined],
    ['/subscriptions/abcdef123/resourceGroups/abcdef123/providers/Microsoft.Network/privateDnsZones/private.eastus2.azmk8s.io', undefined],
    ['/subscriptions/abcdef123/resourceGroups/abcdef123/providers/Microsoft.Network/privateDnsZones/privatelink.eastus2.azmk8s.io', undefined],
    ['system', undefined],
    ['/subscriptions/abcdef123/resourceGroups/abcdef123/providers/Microsoft.Network/privateDnsZones/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.privatelink.eastus2.azmk8s.io', MOCK_TRANSLATION],
    ['privatelink.azmk8s.io', MOCK_TRANSLATION],
    ['privatelink.eastus2.azmk8s.io', MOCK_TRANSLATION]
  ])('returns an error message if the private dns zone does not match privatelink.REGION.azmk8s.io, SUBZONE.privatelink.REGION.azmk8s.io, private.REGION.azmk8s.io, or SUBZONE.private.REGION.azmk8s.io', (privateDnsZone, validatorMsg) => {
    const ctx = { ...mockCtx, config: { privateDnsZone } };

    const validator = validators.privateDnsZone(ctx, '', 'config.privateDnsZone');

    expect(validator()).toStrictEqual(validatorMsg);
  });
});

describe('fx: nodePoolNames', () => {
  it('returns an error when the provided pool name exceeds 12 characters', () => {
    const validator = validators.nodePoolNames(mockCtx);

    expect(validator('abcdefghijklm')).toStrictEqual(MOCK_TRANSLATION);

    expect(validator('abcdefghijkl')).toBeUndefined();
  });

  it('validates each node pool in the provided context when not passed a node pool name', () => {
    const ctx = { ...mockCtx, nodePools: [{ name: 'abcdefghijklm', _validation: {} }, { name: 'abcdefghijkl', _validation: {} }] as unknown as AKSNodePool[] };
    const validator = validators.nodePoolNames(ctx);

    validator();
    expect(ctx.nodePools[0]?._validation?._validName).toStrictEqual(false);

    expect(ctx.nodePools[1]?._validation?._validName).toStrictEqual(true);
  });

  it.each([
    ['abc123', undefined],
    ['abcabc', undefined],
    ['abc-abc', MOCK_TRANSLATION],
    ['abc abc', MOCK_TRANSLATION],
    ['abc_abc', MOCK_TRANSLATION],
    ['abcABC', MOCK_TRANSLATION],
    ['abc:abc', MOCK_TRANSLATION],
  ])('returns an error when the provided pool name includes characters other than lowercase letters and numbers', (name, expected) => {
    const validator = validators.nodePoolNames(mockCtx);

    expect(validator(name)).toStrictEqual(expected);
  });

  it.each([
    ['123abc', MOCK_TRANSLATION],
    ['Abcabc', MOCK_TRANSLATION],
  ])('returns an error when the provided pool name does not start with a lowercase letter', (name, expected) => {
    const validator = validators.nodePoolNames(mockCtx);

    expect(validator(name)).toStrictEqual(expected);
  });
});

describe('fx: nodePoolCount', () => {
  // AksNodePool unit tests check that the second arg is passed in as expected
  it('validates that count is at least 1 and at most 1000 when second arg is false', () => {
    const validator = validators.nodePoolCount(mockCtx);

    expect(validator(1, false)).toBeUndefined();
    expect(validator(0, false)).toStrictEqual(MOCK_TRANSLATION);
    expect(validator(1000, false)).toBeUndefined();
    expect(validator(1001, false)).toStrictEqual(MOCK_TRANSLATION);
  });

  it('validates that count is at least 0 and at most 1000 when second arg is true', () => {
    const validator = validators.nodePoolCount(mockCtx);

    expect(validator(1, true)).toBeUndefined();
    expect(validator(0, true)).toBeUndefined();
    expect(validator(1000, true)).toBeUndefined();

    expect(validator(-1, true)).toStrictEqual(MOCK_TRANSLATION);
    expect(validator(1001, true)).toStrictEqual(MOCK_TRANSLATION);
  });

  it('validates each node pool in the provided context when not passed a count value', () => {
    const ctx = {
      ...mockCtx,
      nodePools: [
        {
          name: 'abc', _validation: {}, mode: 'System', count: 0
        },
        {
          name: 'def', _validation: {}, mode: 'System', count: 1
        },
        {
          name: 'hij', _validation: {}, mode: 'User', count: 0
        },
        {
          name: 'klm', _validation: {}, mode: 'User', count: -1
        },
        {
          name: 'nop', _validation: {}, mode: 'User', count: 1001
        },
        {
          name: 'qrs', _validation: {}, mode: 'System', count: 1001
        }
      ] as unknown as AKSNodePool[]
    };
    const validator = validators.nodePoolCount(ctx);

    validator();
    expect(ctx.nodePools[0]?._validation?._validCount).toStrictEqual(false);
    expect(ctx.nodePools[1]?._validation?._validCount).toStrictEqual(true);
    expect(ctx.nodePools[2]?._validation?._validCount).toStrictEqual(true);
    expect(ctx.nodePools[3]?._validation?._validCount).toStrictEqual(false);
    expect(ctx.nodePools[4]?._validation?._validCount).toStrictEqual(false);
    expect(ctx.nodePools[5]?._validation?._validCount).toStrictEqual(false);
  });
});
