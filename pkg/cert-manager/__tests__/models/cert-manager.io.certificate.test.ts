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
    t:            (key: string) => key,
    // `super.details` reads these; an own property keeps the base getter from touching the store
    owners:       [],
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

    it('should describe the failure, not the still-valid certificate', () => {
      // A certificate can hold a valid cert from an earlier revision while the next one fails.
      // Captioning that with the Ready message reads as "everything is fine" under a red banner.
      const cert = certificate({}, {
        notAfter:               iso(88),
        failedIssuanceAttempts: 4,
        conditions:             [
          {
            type: 'Ready', status: 'True', message: 'Certificate is up to date and has not expired'
          },
          {
            type: 'Issuing', status: 'False', message: 'The certificate request has failed to complete'
          },
        ],
      });

      expect(cert.state).toBe('error');
      expect(cert.stateDescription).toBe('The certificate request has failed to complete');
    });

    it('should not treat a not-yet-ready certificate as a failure', () => {
      const cert = certificate({}, {
        notAfter:   iso(88),
        conditions: [
          {
            type: 'Ready', status: 'False', message: 'Issuing certificate as Secret does not exist'
          },
          {
            type: 'Issuing', status: 'True', message: 'Issuing certificate'
          },
        ],
      });

      expect(cert.state).toBe('in-progress');
      expect(cert.stateDescription).toBe('Issuing certificate as Secret does not exist');
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

  describe('issuanceStages', () => {
    const stage = (rows: any[]) => certificate({}, {}, { rows });
    const request = (orders: any[] = []) => ({ metadata: { namespace: 'default', annotations: { 'cert-manager.io/certificate-name': 'my-cert' } }, orders });

    it('should stop at the certificate when nothing has been requested yet', () => {
      const cert = certificate();

      expect(cert.issuanceStages.map((s: any) => s.labelKey)).toStrictEqual(['certManager.issuance.certificate']);
      expect(cert.issuanceStages[0].resource).toBe(cert);
    });

    it('should stop at the request for a non-ACME issuer, which never creates an order', () => {
      expect(stage([request()]).issuanceStages.map((s: any) => s.labelKey)).toStrictEqual([
        'certManager.issuance.certificate',
        'certManager.issuance.certificateRequest',
      ]);
    });

    it('should include the order once ACME has one', () => {
      const order = { challenges: [] };

      expect(stage([request([order])]).issuanceStages.map((s: any) => s.labelKey)).toStrictEqual([
        'certManager.issuance.certificate',
        'certManager.issuance.certificateRequest',
        'certManager.issuance.order',
      ]);
    });

    it('should include the challenge, which is where a stuck issuance usually sits', () => {
      const challenge = { id: 'c1' };
      const order = { challenges: [challenge] };
      const stages = stage([request([order])]).issuanceStages;

      expect(stages.map((s: any) => s.labelKey)).toStrictEqual([
        'certManager.issuance.certificate',
        'certManager.issuance.certificateRequest',
        'certManager.issuance.order',
        'certManager.issuance.challenge',
      ]);
      expect(stages[3].resource).toBe(challenge);
    });
  });

  describe('masthead chips', () => {
    it('should show the first subject alternative name plus a count', () => {
      // Mirrors how the shell shows a TLS Secret's certificate names; the full list is in the YAML.
      const cert = certificate({ dnsNames: ['a.com', 'b.com'], ipAddresses: ['10.0.0.1'] });

      expect(cert.subjectAltNamesDisplay).toBe('a.com certManager.certificate.plusMore');
    });

    it('should not add a count for a single name', () => {
      expect(certificate({ dnsNames: ['a.com'] }).subjectAltNamesDisplay).toBe('a.com');
    });

    it('should be undefined when the certificate has no alternative names', () => {
      expect(certificate({ commonName: 'a.com' }).subjectAltNamesDisplay).toBeUndefined();
    });

    it('should gather every kind of alternative name', () => {
      const cert = certificate({
        dnsNames: ['a.com'], ipAddresses: ['10.0.0.1'], uris: ['spiffe://x'], emailAddresses: ['a@b.com']
      });

      expect(cert.subjectAltNames).toStrictEqual(['a.com', '10.0.0.1', 'spiffe://x', 'a@b.com']);
    });

    it.each([
      ['algorithm and size', { algorithm: 'RSA', size: 2048 }, 'RSA 2048'],
      ['an algorithm with no size, as Ed25519 has none', { algorithm: 'Ed25519' }, 'Ed25519'],
    ])('should summarise the private key from %s', (_label, privateKey, expected) => {
      expect(certificate({ privateKey }).privateKeyDisplay).toBe(expected);
    });

    it('should have no private key summary when nothing is set', () => {
      expect(certificate({ privateKey: {} }).privateKeyDisplay).toBeUndefined();
    });
  });

  describe('details', () => {
    // DetailTop in the masthead renders these, and drops any entry with empty content.
    const labelsOf = (model: any) => model.details.filter((d: any) => !d.separator).map((d: any) => d.label);

    it('should surface the certificate facts for the masthead', () => {
      const cert = certificate(
        {
          issuerRef: { name: 'my-issuer' }, secretName: 'my-tls', commonName: 'example.com'
        },
        { revision: 2, notAfter: iso(30) },
      );

      expect(labelsOf(cert)).toStrictEqual([
        'certManager.tableHeaders.issuer',
        'certManager.tableHeaders.secret',
        'certManager.certificate.commonName',
        'certManager.certificate.sans',
        'certManager.tableHeaders.expires',
        'certManager.tableHeaders.renews',
        'certManager.certificate.failedAttempts',
        'certManager.certificate.lastFailure',
      ]);
    });

    it('should link the issuer and the secret', () => {
      const cert = certificate({ issuerRef: { name: 'my-issuer' }, secretName: 'my-tls' });
      const [issuer, secret] = cert.details;

      expect(issuer.formatter).toBe('Link');
      expect(issuer.content).toBe('my-issuer');
      expect(issuer.formatterOpts.to).toStrictEqual(cert.issuerLocation);
      expect(secret.formatterOpts.to).toStrictEqual(cert.secretLocation);
    });

    it('should not render a future expiry as though it already passed', () => {
      // LiveDate unconditionally appends "ago", so an expiry 88 days away read as "88 days ago".
      const cert = certificate({}, { notAfter: iso(88) });
      const expires = cert.details.find((d: any) => d.label === 'certManager.tableHeaders.expires');

      expect(expires.formatter).toBe('LiveExpiryDate');
      expect(expires.formatterOpts.row).toBe(cert);
    });

    it('should only say "ago" for a date that is always in the past', () => {
      const cert = certificate({}, {
        notBefore: iso(-2), renewalTime: iso(58), lastFailureTime: iso(-5)
      });
      const byLabel = (label: string) => cert.details.find((d: any) => d.label === label);

      expect(byLabel('certManager.certificate.lastFailure').formatterOpts).toStrictEqual({ addSuffix: true });
      expect(byLabel('certManager.tableHeaders.renews').formatterOpts).toBeUndefined();
    });

    it('should keep the base details from the shell model', () => {
      // `super.details` carries owner references, deletion timestamps and the like.
      const cert = certificate();

      expect(Array.isArray(cert.details)).toBe(true);
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

    // The field is a plain optional input, so clearing it leaves '' rather than removing the key.
    it('should drop a common name the user emptied', () => {
      expect(clean({ commonName: '' })).toStrictEqual({ spec: {} });
    });

    it('should keep a common name that was set', () => {
      expect(clean({ commonName: 'example.com' }).spec.commonName).toBe('example.com');
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
    const byAnnotation = (name: string, namespace = 'default', revision?: string) => ({
      metadata: {
        namespace,
        annotations: {
          'cert-manager.io/certificate-name': name,
          ...(revision ? { 'cert-manager.io/certificate-revision': revision } : {}),
        },
      },
    });

    it('should match on the certificate-name annotation', () => {
      const mine = byAnnotation('my-cert');
      const theirs = byAnnotation('other-cert');

      expect(certificate({}, {}, { rows: [mine, theirs] }).certificateRequests).toStrictEqual([mine]);
    });

    it('should still match on ownerReferences when the annotation is absent', () => {
      // Steve does not always include ownerReferences in list responses, hence the annotation
      // first - but resources created by older cert-manager versions only have the owner ref.
      const mine = { metadata: { namespace: 'default', ownerReferences: [{ uid: 'cert-uid' }] } };

      expect(certificate({}, {}, { rows: [mine] }).certificateRequests).toStrictEqual([mine]);
    });

    it('should not match a same-named certificate in another namespace', () => {
      expect(certificate({}, {}, { rows: [byAnnotation('my-cert', 'other')] }).certificateRequests).toStrictEqual([]);
    });

    it('should return the newest revision first', () => {
      const first = byAnnotation('my-cert', 'default', '1');
      const third = byAnnotation('my-cert', 'default', '3');
      const second = byAnnotation('my-cert', 'default', '2');

      expect(certificate({}, {}, { rows: [first, third, second] }).certificateRequests).toStrictEqual([third, second, first]);
    });

    it('should be empty when the store has nothing', () => {
      expect(certificate().certificateRequests).toStrictEqual([]);
    });
  });

  describe('hasMissingIssuer', () => {
    /**
     * `hasMissingIssuer` reads both `cluster/all` (to find the issuer) and `cluster/schemaFor`
     * (to know whether it could see one at all), so this helper supplies both.
     */
    const cert = (spec: any, issuerRows: any[], hasSchema = true) => {
      const ctx = {
        metadata:     { name: 'my-cert', namespace: 'default' },
        spec,
        status:       {},
        t:            (key: string) => key,
        owners:       [],
        $rootGetters: {
          'cluster/all':       () => issuerRows,
          'cluster/schemaFor': () => (hasSchema ? {} : undefined),
          productId:           'explorer',
          clusterId:           'local',
        },
      };

      return Object.create(Certificate.prototype, Object.getOwnPropertyDescriptors(ctx)) as any;
    };

    const issuer = (name: string, namespace: string | undefined = 'default', type: string = CERT_MANAGER.ISSUER) => ({ metadata: { name, namespace }, type });

    it('should be false when the certificate names no issuer', () => {
      expect(cert({}, []).hasMissingIssuer).toBe(false);
    });

    it('should be false when the referenced Issuer is loaded', () => {
      const model = cert({ issuerRef: { name: 'my-issuer' } }, [issuer('my-issuer')]);

      expect(model.hasMissingIssuer).toBe(false);
      expect(model.issuerResource).toStrictEqual(issuer('my-issuer'));
    });

    it('should be true when the referenced Issuer cannot be found', () => {
      expect(cert({ issuerRef: { name: 'gone' } }, []).hasMissingIssuer).toBe(true);
    });

    it('should be true when a same-named Issuer lives in another namespace', () => {
      // An Issuer only signs certificates in its own namespace, so one elsewhere does not count.
      expect(cert({ issuerRef: { name: 'my-issuer' } }, [issuer('my-issuer', 'other')]).hasMissingIssuer).toBe(true);
    });

    it('should match a ClusterIssuer regardless of namespace', () => {
      const model = cert(
        { issuerRef: { name: 'letsencrypt', kind: 'ClusterIssuer' } },
        [issuer('letsencrypt', undefined, CERT_MANAGER.CLUSTER_ISSUER)],
      );

      expect(model.hasMissingIssuer).toBe(false);
    });

    it('should stay false when the issuer type is not readable', () => {
      // With no schema we cannot tell whether the issuer exists, so we do not raise a false alarm.
      expect(cert({ issuerRef: { name: 'gone' } }, [], false).hasMissingIssuer).toBe(false);
    });
  });
});
