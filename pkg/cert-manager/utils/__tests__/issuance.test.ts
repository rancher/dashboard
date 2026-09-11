import { certificateNameOf, relatedTo } from '../issuance';

const NS = 'default';

const certificate = {
  metadata: {
    name: 'web-tls', namespace: NS, uid: 'cert-uid'
  }
};

const annotated = (extra: Record<string, any> = {}) => ({
  metadata: {
    namespace:   NS,
    annotations: { 'cert-manager.io/certificate-name': 'web-tls' },
    ...extra,
  },
});

describe('fx: certificateNameOf', () => {
  it('should read the annotation', () => {
    expect(certificateNameOf(annotated())).toBe('web-tls');
  });

  it('should fall back to a Certificate ownerReference', () => {
    const resource = { metadata: { ownerReferences: [{ kind: 'Certificate', name: 'web-tls' }] } };

    expect(certificateNameOf(resource)).toBe('web-tls');
  });

  it('should ignore ownerReferences of other kinds', () => {
    const resource = { metadata: { ownerReferences: [{ kind: 'Order', name: 'some-order' }] } };

    expect(certificateNameOf(resource)).toBeUndefined();
  });

  it.each([
    ['undefined', undefined],
    ['an empty object', {}],
    ['a resource with no metadata', { spec: {} }],
  ])('should return undefined for %s', (_label, resource) => {
    expect(certificateNameOf(resource)).toBeUndefined();
  });
});

describe('fx: relatedTo', () => {
  it('should be empty when nothing matches', () => {
    expect(relatedTo([], certificate)).toStrictEqual([]);
  });

  it('should exclude resources belonging to a different certificate', () => {
    const other = { metadata: { namespace: NS, annotations: { 'cert-manager.io/certificate-name': 'api-tls' } } };

    expect(relatedTo([other], certificate)).toStrictEqual([]);
  });

  it('should exclude a same-named certificate in another namespace', () => {
    const elsewhere = { metadata: { namespace: 'other', annotations: { 'cert-manager.io/certificate-name': 'web-tls' } } };

    expect(relatedTo([elsewhere], certificate)).toStrictEqual([]);
  });

  it('should sort by revision descending, treating a missing revision as oldest', () => {
    const none = annotated();
    const two = annotated({ annotations: { 'cert-manager.io/certificate-name': 'web-tls', 'cert-manager.io/certificate-revision': '2' } });
    const five = annotated({ annotations: { 'cert-manager.io/certificate-name': 'web-tls', 'cert-manager.io/certificate-revision': '5' } });

    expect(relatedTo([none, two, five], certificate)).toStrictEqual([five, two, none]);
  });
});
