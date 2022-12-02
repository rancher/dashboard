import { getPSATooltipsDescription } from '~/shell/utils/pod-security-admission';

describe('fX: getPSATooltipsDescription', () => {
  it('should return empty object if no labels', () => {
    const resource = { metadata: { labels: {} } };

    const result = getPSATooltipsDescription(resource);

    expect(result).toStrictEqual({});
  });

  it('should return prettified dictionary of labels', () => {
    const resource = { metadata: { labels: { 'psp.kubernetes.io/enforce': 'restricted' } } };

    const result = getPSATooltipsDescription(resource);

    expect(result).toStrictEqual({ 'psp.kubernetes.io/enforce': 'Enforce Restricted (latest)' });
  });

  it.todo('should return prettified dictionary of labels with version');
});
