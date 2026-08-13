import Issuer from '../../models/cert-manager.io.issuer';
import ClusterIssuer from '../../models/cert-manager.io.clusterissuer';
import { CERT_MANAGER } from '../../types';

function build(Model: any, type: string, spec: any = {}, status: any = {}, opts: { namespace?: string; rows?: any[] } = {}) {
  const ctx = {
    type,
    metadata:     { name: 'my-issuer', namespace: opts.namespace ?? 'default' },
    spec,
    status,
    t:            (key: string) => key,
    $rootGetters: { 'cluster/all': () => opts.rows },
  };

  return Object.create(Model.prototype, Object.getOwnPropertyDescriptors(ctx)) as any;
}

const issuer = (spec?: any, status?: any, opts?: any) => build(Issuer, CERT_MANAGER.ISSUER, spec, status, opts);
const clusterIssuer = (spec?: any, status?: any, opts?: any) => build(ClusterIssuer, CERT_MANAGER.CLUSTER_ISSUER, spec, status, { namespace: undefined, ...opts });

describe('model: cert-manager.io.issuer', () => {
  describe('configType', () => {
    it.each([
      ['acme'],
      ['ca'],
      ['selfSigned'],
      ['vault'],
      ['venafi'],
    ])('should detect %s', (type) => {
      expect(issuer({ [type]: {} }).configType).toBe(type);
    });

    it('should be undefined when no config is set', () => {
      expect(issuer().configType).toBeUndefined();
    });

    it('should translate the type for display', () => {
      expect(issuer({ selfSigned: {} }).configTypeDisplay).toBe('certManager.issuer.type.selfSigned');
    });

    it('should display nothing when no config is set', () => {
      expect(issuer().configTypeDisplay).toBe('');
    });
  });

  describe('issuerTypeDisplay', () => {
    it('should name the ACME provider alongside the type', () => {
      const model = issuer({ acme: { server: 'https://acme-v02.api.letsencrypt.org/directory' } });

      expect(model.issuerTypeDisplay).toBe("certManager.issuer.type.acme (Let's Encrypt)");
    });

    it('should fall back to the host for an unrecognised ACME server', () => {
      const model = issuer({ acme: { server: 'https://ca.internal/acme/directory' } });

      expect(model.issuerTypeDisplay).toBe('certManager.issuer.type.acme (ca.internal)');
    });

    it('should show just the type for a non-ACME issuer', () => {
      expect(issuer({ selfSigned: {} }).issuerTypeDisplay).toBe('certManager.issuer.type.selfSigned');
    });

    it('should show nothing for an issuer with no config', () => {
      expect(issuer().issuerTypeDisplay).toBe('');
    });
  });

  describe('state', () => {
    it('should be active when ready', () => {
      expect(issuer({}, { conditions: [{ type: 'Ready', status: 'True' }] }).state).toBe('active');
    });

    it('should be error when not ready', () => {
      expect(issuer({}, { conditions: [{ type: 'Ready', status: 'False' }] }).state).toBe('error');
    });

    it('should be pending with no conditions', () => {
      expect(issuer().state).toBe('pending');
    });

    it('should keep a failure reason visible in the description', () => {
      const model = issuer({}, {
        conditions: [{
          type: 'Ready', status: 'False', reason: 'AuthFailed', message: 'bad credentials'
        }],
      });

      expect(model.stateDescription).toBe('AuthFailed: bad credentials');
    });

    it('should not prefix the description with a Ready reason', () => {
      const model = issuer({}, {
        conditions: [{
          type: 'Ready', status: 'True', reason: 'Ready', message: 'account registered'
        }],
      });

      expect(model.stateDescription).toBe('account registered');
    });
  });

  describe('acmeServerDisplay', () => {
    it.each([
      ['https://acme-v02.api.letsencrypt.org/directory', 'Let\'s Encrypt'],
      ['https://acme-staging-v02.api.letsencrypt.org/directory', 'Let\'s Encrypt (Staging)'],
    ])('should name well known server %s', (server, expected) => {
      expect(issuer({ acme: { server } }).acmeServerDisplay).toBe(expected);
    });

    it('should fall back to the host for an unknown server', () => {
      expect(issuer({ acme: { server: 'https://ca.internal:8443/acme/directory' } }).acmeServerDisplay).toBe('ca.internal:8443');
    });

    it('should fall back to the raw value when it is not a URL', () => {
      expect(issuer({ acme: { server: 'not a url' } }).acmeServerDisplay).toBe('not a url');
    });

    it('should be undefined for a non-ACME issuer', () => {
      expect(issuer({ selfSigned: {} }).acmeServerDisplay).toBeUndefined();
    });
  });

  describe('solverSummaries', () => {
    it('should describe an HTTP-01 solver by ingress class', () => {
      const model = issuer({
        acme: {
          solvers: [{
            selector: { dnsZones: ['example.com'] },
            http01:   { ingress: { ingressClassName: 'nginx' } },
          }],
        },
      });

      expect(model.solverSummaries).toStrictEqual([
        {
          type: 'HTTP-01', provider: 'nginx', selector: ['example.com']
        },
      ]);
    });

    it('should describe a DNS-01 solver by provider', () => {
      const model = issuer({
        acme: {
          solvers: [{
            selector: { matchLabels: { 'use-dns': 'true' } },
            dns01:    { cloudflare: { email: 'a@b.com' } },
          }],
        },
      });

      expect(model.solverSummaries).toStrictEqual([
        {
          type: 'DNS-01', provider: 'cloudflare', selector: ['use-dns=true']
        },
      ]);
    });

    it('should report an empty selector for a catch-all solver', () => {
      const model = issuer({ acme: { solvers: [{ http01: { ingress: {} } }] } });

      expect(model.solverSummaries[0].selector).toStrictEqual([]);
    });

    it('should be empty for a non-ACME issuer', () => {
      expect(issuer({ ca: { secretName: 'ca' } }).solverSummaries).toStrictEqual([]);
    });
  });

  describe('certificates', () => {
    const cert = (name: string, namespace: string, issuerRef: any) => ({ metadata: { name, namespace }, spec: { issuerRef } });

    it('should only match certificates in its own namespace', () => {
      const same = cert('a', 'default', { name: 'my-issuer' });
      const other = cert('b', 'other', { name: 'my-issuer' });
      const model = issuer({}, {}, { rows: [same, other] });

      expect(model.certificates).toStrictEqual([same]);
    });

    it('should not match a ClusterIssuer reference of the same name', () => {
      const clusterRef = cert('a', 'default', { name: 'my-issuer', kind: 'ClusterIssuer' });

      expect(issuer({}, {}, { rows: [clusterRef] }).certificates).toStrictEqual([]);
    });
  });
});

describe('model: cert-manager.io.clusterissuer', () => {
  it('should share the Issuer behaviour', () => {
    expect(clusterIssuer({ acme: {} }).configType).toBe('acme');
  });

  it('should match referencing certificates in every namespace', () => {
    const rows = [
      { metadata: { name: 'a', namespace: 'default' }, spec: { issuerRef: { name: 'my-issuer', kind: 'ClusterIssuer' } } },
      { metadata: { name: 'b', namespace: 'other' }, spec: { issuerRef: { name: 'my-issuer', kind: 'ClusterIssuer' } } },
      { metadata: { name: 'c', namespace: 'other' }, spec: { issuerRef: { name: 'my-issuer' } } },
    ];

    expect(clusterIssuer({}, {}, { rows }).certificates.map((c: any) => c.metadata.name)).toStrictEqual(['a', 'b']);
  });
});
