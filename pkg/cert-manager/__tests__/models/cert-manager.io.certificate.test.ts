import day from 'dayjs';
import { SECRET } from '@shell/config/types';
import Certificate from '../../models/cert-manager.io.certificate';
import { CERT_MANAGER } from '../../types';

const iso = (offsetDays: number) => day().add(offsetDays, 'day').toISOString();

/**
 * `$rootGetters` is an accessor on the model base class, so it has to be supplied as an own
 * property descriptor rather than assigned after construction.
 */
function certificate(spec: any = {}, status: any = {}, opts: { metadata?: any; rows?: any[] } = {}) {
  const ctx = {
    metadata: {
      name: 'my-cert', namespace: 'default', uid: 'cert-uid', ...opts.metadata
    },
    spec,
    status,
    $rootGetters: {
      'cluster/all': () => opts.rows, productId: 'explorer', clusterId: 'local'
    },
  };

  return Object.create(Certificate.prototype, Object.getOwnPropertyDescriptors(ctx)) as any;
}

const ready = (status: 'True' | 'False', extra: any = {}) => ({
  conditions: [{
    type: 'Ready', status, ...extra
  }]
});

describe('model: cert-manager.io.certificate', () => {
  describe('state', () => {
    it('should report expired ahead of everything else', () => {
      // A certificate can still report Ready=True while the material it stored has expired.
      const cert = certificate({}, {
        ...ready('True'),
        notAfter: iso(-1),
      });

      expect(cert.state).toBe('expired');
    });

    it('should report expiring once the renewal time has passed', () => {
      const cert = certificate({}, {
        ...ready('True'),
        notAfter:    iso(365),
        renewalTime: iso(-1),
      });

      expect(cert.state).toBe('expiring');
    });

    it('should report expiring when the expiry is within 30 days', () => {
      const cert = certificate({}, { ...ready('True'), notAfter: iso(5) });

      expect(cert.state).toBe('expiring');
    });

    it('should report in-progress while issuing', () => {
      const cert = certificate({}, {
        conditions: [{ type: 'Ready', status: 'False' }, { type: 'Issuing', status: 'True' }],
        notAfter:   iso(365),
      });

      expect(cert.state).toBe('in-progress');
    });

    it('should report error when not ready', () => {
      const cert = certificate({}, { ...ready('False'), notAfter: iso(365) });

      expect(cert.state).toBe('error');
    });

    it('should report error after a failed issuance attempt', () => {
      const cert = certificate({}, {
        ...ready('True'),
        notAfter:               iso(365),
        failedIssuanceAttempts: 2,
      });

      expect(cert.state).toBe('error');
    });

    it('should report active when ready and not near expiry', () => {
      const cert = certificate({}, { ...ready('True'), notAfter: iso(365) });

      expect(cert.state).toBe('active');
    });

    it('should report pending before any condition is set', () => {
      expect(certificate().state).toBe('pending');
    });
  });

  describe('stateDescription', () => {
    it('should surface the Ready condition message', () => {
      const cert = certificate({}, ready('False', { message: 'Issuer not found' }));

      expect(cert.stateDescription).toBe('Issuer not found');
    });

    it('should be empty when there are no conditions', () => {
      expect(certificate().stateDescription).toBe('');
    });
  });

  describe('dnsNamesDisplay', () => {
    it('should list the common name first and never repeat it', () => {
      const cert = certificate({
        commonName:  'example.com',
        dnsNames:    ['www.example.com', 'example.com'],
        ipAddresses: ['10.0.0.1'],
        uris:        ['spiffe://cluster/ns/default/sa/app'],
      });

      expect(cert.dnsNamesDisplay).toStrictEqual([
        'example.com',
        'www.example.com',
        '10.0.0.1',
        'spiffe://cluster/ns/default/sa/app',
      ]);
    });

    it('should work without a common name', () => {
      expect(certificate({ dnsNames: ['a.com'] }).dnsNamesDisplay).toStrictEqual(['a.com']);
    });

    it('should be empty when nothing is set', () => {
      expect(certificate().dnsNamesDisplay).toStrictEqual([]);
    });
  });

  describe('issuerLocation', () => {
    it('should link to a namespaced Issuer by default', () => {
      const cert = certificate({ issuerRef: { name: 'my-issuer' } });

      expect(cert.issuerLocation).toStrictEqual({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          product: 'explorer', cluster: 'local', resource: CERT_MANAGER.ISSUER, namespace: 'default', id: 'my-issuer'
        },
      });
    });

    it('should link to a cluster scoped ClusterIssuer without a namespace', () => {
      const cert = certificate({ issuerRef: { name: 'letsencrypt', kind: 'ClusterIssuer' } });

      expect(cert.issuerLocation).toStrictEqual({
        name:   'c-cluster-product-resource-id',
        params: {
          product: 'explorer', cluster: 'local', resource: CERT_MANAGER.CLUSTER_ISSUER, namespace: undefined, id: 'letsencrypt'
        },
      });
    });

    it('should be null without an issuerRef', () => {
      expect(certificate().issuerLocation).toBeNull();
    });
  });

  describe('secretLocation', () => {
    it('should link to the secret in the same namespace', () => {
      expect(certificate({ secretName: 'my-tls' }).secretLocation).toStrictEqual({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          product: 'explorer', cluster: 'local', resource: SECRET, namespace: 'default', id: 'my-tls'
        },
      });
    });

    it('should be null without a secretName', () => {
      expect(certificate().secretLocation).toBeNull();
    });
  });

  describe('cleanForSave', () => {
    // The edit form has to create these before its inputs can bind to them, so an untouched
    // Private Key or Advanced tab would otherwise persist an empty object.
    const clean = (spec: any) => {
      const model = certificate();

      Object.getPrototypeOf(Object.getPrototypeOf(model)).cleanForSave = (data: any) => data;

      return model.cleanForSave({ spec }, true);
    };

    it('should drop an untouched privateKey', () => {
      expect(clean({ privateKey: {}, secretName: 'a' }).spec.privateKey).toBeUndefined();
    });

    it('should drop an untouched secretTemplate', () => {
      expect(clean({ secretTemplate: {} }).spec.secretTemplate).toBeUndefined();
    });

    it('should keep them once they hold anything', () => {
      const out = clean({ privateKey: { algorithm: 'RSA' }, secretTemplate: { labels: { a: 'b' } } });

      expect(out.spec.privateKey).toStrictEqual({ algorithm: 'RSA' });
      expect(out.spec.secretTemplate).toStrictEqual({ labels: { a: 'b' } });
    });

    it('should cope with a spec that has neither', () => {
      expect(() => clean({ secretName: 'a' })).not.toThrow();
    });
  });

  describe('route locations', () => {
    it.each([
      ['issuerLocation', certificate({ issuerRef: { name: 'my-issuer' } })],
      ['secretLocation', certificate({ secretName: 'my-tls' })],
    ])('%s should carry the params the explorer routes require', (getter, cert) => {
      // RouterLink throws on a named route with a missing required param, and Vue then renders
      // nothing at all - no link, no text. Every location must name product and cluster.
      expect(cert[getter].params.product).toBe('explorer');
      expect(cert[getter].params.cluster).toBe('local');
      expect(cert[getter].params.resource).toEqual(expect.any(String));
      expect(cert[getter].params.id).toEqual(expect.any(String));
    });
  });

  describe('certificateRequests', () => {
    it('should only return requests owned by this certificate', () => {
      const mine = { metadata: { ownerReferences: [{ uid: 'cert-uid' }] } };
      const theirs = { metadata: { ownerReferences: [{ uid: 'other-uid' }] } };
      const orphan = { metadata: {} };
      const cert = certificate({}, {}, { rows: [mine, theirs, orphan] });

      expect(cert.certificateRequests).toStrictEqual([mine]);
    });

    it('should be empty when the store has nothing', () => {
      expect(certificate().certificateRequests).toStrictEqual([]);
    });
  });
});
