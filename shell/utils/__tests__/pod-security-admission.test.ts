import { PSA } from '@shell/types/resources/pod-security-admission';
import { getPSATooltipsDescription } from '@shell/utils/pod-security-admission';

describe('fX: getPSATooltipsDescription', () => {
  it('should return empty object if no labels', () => {
    const resource = { metadata: { labels: {} } } as Partial<PSA> as PSA;

    const result = getPSATooltipsDescription(resource);

    expect(result).toStrictEqual({});
  });

  it('should return prettified dictionary of labels', () => {
    const resource = { metadata: { labels: { 'pod-security.kubernetes.io/enforce': 'restricted' } } } as Partial<PSA> as PSA;

    const result = getPSATooltipsDescription(resource);

    expect(result).toStrictEqual({ 'pod-security.kubernetes.io/enforce': 'Enforce Restricted (latest)' });
  });

  it('should exclude non-PSA labels', () => {
    const resource = {
      metadata: {
        labels: {
          'field.cattle.io/projectId':          'p-68z77',
          'kubernetes.io/metadata.name':        'psa-test-ns',
          'pod-security.kubernetes.io/enforce': 'privileged',
          bananas:                              'potatoes'
        },
      }
    } as Partial<PSA> as PSA;

    const result = getPSATooltipsDescription(resource);

    expect(result).toStrictEqual({ 'pod-security.kubernetes.io/enforce': 'Enforce Privileged (latest)' });
  });

  it('should return prettified dictionary of labels with version', () => {
    const version = '1.0.0';
    const resource = {
      metadata: {
        labels: {
          'pod-security.kubernetes.io/enforce':         'privileged',
          'pod-security.kubernetes.io/enforce-version': version
        }
      }
    } as Partial<PSA> as PSA;

    const result = getPSATooltipsDescription(resource);

    expect(result).toStrictEqual({ 'pod-security.kubernetes.io/enforce': `Enforce Privileged (${ version })` });
  });

  it(`should return prettified dictionary of labels with 'latest' as default version if none`, () => {
    const resource = { metadata: { labels: { 'pod-security.kubernetes.io/enforce': 'privileged' } } } as Partial<PSA> as PSA;

    const result = getPSATooltipsDescription(resource);

    expect(result).toStrictEqual({ 'pod-security.kubernetes.io/enforce': `Enforce Privileged (latest)` });
  });
});
