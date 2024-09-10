import * as validators from '@pkg/aks/util/validators';
import { set } from '@shell/utils/object';
import { AKSNodePool } from 'types';

validators.requiredTranslation = (ctx, label) => `${ label } is required.`;

validators.needsValidation = () => true;

const MOCK_TRANSLATION = 'abc';

const mockCtx = {
  normanCluster: { },
  t:             () => MOCK_TRANSLATION,
  $set:          set
};

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
    const ctx = { ...mockCtx, normanCluster: { aksConfig: { nodeGroupName } } };

    const validator = validators.resourceGroupChars(ctx, '', 'aksConfig.nodeGroupName');

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
    const ctx = { ...mockCtx, normanCluster: { aksConfig: { privateDnsZone } } };

    const validator = validators.privateDnsZone(ctx, '', 'aksConfig.privateDnsZone');

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
