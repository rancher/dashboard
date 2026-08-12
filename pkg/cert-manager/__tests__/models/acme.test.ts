import Order from '../../models/acme.cert-manager.io.order';
import Challenge from '../../models/acme.cert-manager.io.challenge';
import { CERT_MANAGER } from '../../types';

function build(Model: any, spec: any = {}, status: any = {}, opts: { metadata?: any; rows?: any[] } = {}) {
  const ctx = {
    metadata: {
      name: 'my-resource', namespace: 'default', uid: 'my-uid', ...opts.metadata
    },
    spec,
    status,
    $rootGetters: { 'cluster/all': () => opts.rows },
  };

  return Object.create(Model.prototype, Object.getOwnPropertyDescriptors(ctx)) as any;
}

const order = (spec?: any, status?: any, opts?: any) => build(Order, spec, status, opts);
const challenge = (spec?: any, status?: any, opts?: any) => build(Challenge, spec, status, opts);

describe('model: acme.cert-manager.io.order', () => {
  it.each([
    ['valid', 'active'],
    ['ready', 'in-progress'],
    ['processing', 'in-progress'],
    ['pending', 'pending'],
    ['invalid', 'error'],
    ['errored', 'error'],
    ['expired', 'expired'],
  ])('should map ACME state %s to %s', (acme, expected) => {
    expect(order({}, { state: acme }).state).toBe(expected);
  });

  it('should be unknown for an unrecognised or absent state', () => {
    expect(order({}, { state: 'something-new' }).state).toBe('unknown');
    expect(order().state).toBe('unknown');
  });

  it('should surface the reason as the state description', () => {
    expect(order({}, { reason: 'rate limited' }).stateDescription).toBe('rate limited');
    expect(order().stateDescription).toBe('');
  });

  it('should list the common name first without repeating it', () => {
    const model = order({ commonName: 'example.com', dnsNames: ['example.com', 'www.example.com'] });

    expect(model.dnsNamesDisplay).toStrictEqual(['example.com', 'www.example.com']);
  });

  it('should summarise authorizations', () => {
    const model = order({}, {
      authorizations: [{
        identifier: 'example.com',
        wildcard:   true,
        url:        'https://acme/authz/1',
        challenges: [{ type: 'dns-01' }, { type: 'http-01' }],
      }],
    });

    expect(model.authorizationSummaries).toStrictEqual([{
      identifier:     'example.com',
      wildcard:       true,
      url:            'https://acme/authz/1',
      challengeTypes: ['dns-01', 'http-01'],
    }]);
  });

  it('should default wildcard to false and challenge types to empty', () => {
    const model = order({}, { authorizations: [{ identifier: 'example.com' }] });

    expect(model.authorizationSummaries[0]).toStrictEqual({
      identifier: 'example.com', wildcard: false, url: undefined, challengeTypes: []
    });
  });

  it('should only return challenges it owns', () => {
    const mine = { metadata: { ownerReferences: [{ uid: 'my-uid' }] } };
    const theirs = { metadata: { ownerReferences: [{ uid: 'other' }] } };

    expect(order({}, {}, { rows: [mine, theirs] }).challenges).toStrictEqual([mine]);
  });

  it('should link to the owning CertificateRequest', () => {
    const model = order({}, {}, { metadata: { ownerReferences: [{ kind: 'CertificateRequest', name: 'my-cr' }] } });

    expect(model.ownerCertificateRequestLocation).toStrictEqual({
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        resource: CERT_MANAGER.CERTIFICATE_REQUEST, namespace: 'default', id: 'my-cr'
      },
    });
  });

  it('should have no owner link when there is no CertificateRequest owner', () => {
    expect(order().ownerCertificateRequestLocation).toBeNull();
  });
});

describe('model: acme.cert-manager.io.challenge', () => {
  it.each([
    ['valid', 'active'],
    ['invalid', 'error'],
    ['expired', 'expired'],
  ])('should map ACME state %s to %s', (acme, expected) => {
    expect(challenge({}, { state: acme }).state).toBe(expected);
  });

  it('should distinguish a challenge being worked on from one merely queued', () => {
    expect(challenge({}, { state: 'pending' }).state).toBe('pending');
    expect(challenge({}, { state: 'pending', processing: true }).state).toBe('in-progress');
  });

  it('should mark a wildcard dns name', () => {
    expect(challenge({ dnsName: 'example.com', wildcard: true }).dnsNameDisplay).toBe('*.example.com');
    expect(challenge({ dnsName: 'example.com' }).dnsNameDisplay).toBe('example.com');
    expect(challenge().dnsNameDisplay).toBe('');
  });

  it.each([
    ['a DNS-01 provider', { dns01: { route53: {} } }, 'route53'],
    ['an HTTP-01 ingress class', { http01: { ingress: { ingressClassName: 'traefik' } } }, 'traefik'],
    ['a legacy HTTP-01 class', { http01: { ingress: { class: 'nginx' } } }, 'nginx'],
  ])('should summarise the solver from %s', (_label, solver, expected) => {
    expect(challenge({ solver }).solverSummary).toBe(expected);
  });

  it('should link to the owning Order', () => {
    const model = challenge({}, {}, { metadata: { ownerReferences: [{ kind: 'Order', name: 'my-order' }] } });

    expect(model.ownerOrderLocation).toStrictEqual({
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        resource: CERT_MANAGER.ORDER, namespace: 'default', id: 'my-order'
      },
    });
  });
});
