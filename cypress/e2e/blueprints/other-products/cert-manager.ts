import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

/**
 * Mocks the cert-manager extension's backend so its overview can be exercised without cert-manager
 * actually installed on the cluster.
 *
 * Two things have to be faked for the page to render:
 *  - the cluster's Steve schemas must include the cert-manager CRDs, or the overview's `findAll`
 *    calls never fire (`checkSchemasForFindAllHash` gates each fetch on `schemaFor(type)`), and the
 *    nav group's `ifHaveType` gate would hide it entirely;
 *  - the Steve collection endpoints for each type must return the fixture rows the overview counts.
 *
 * `generateCertManagerEmpty` returns no resources (the "get started" empty state);
 * `generateCertManagerWithData` returns a small, deterministic set that drives every summary widget.
 */

const CLUSTER = 'local';
const V1 = `/k8s/clusters/${ CLUSTER }/v1`;

/** cert-manager stamps everything it creates for a certificate with these - see utils/issuance. */
const CERTIFICATE_NAME_ANNOTATION = 'cert-manager.io/certificate-name';
const CERTIFICATE_REVISION_ANNOTATION = 'cert-manager.io/certificate-revision';

interface SchemaSpec {
  id: string;
  group: string;
  kind: string;
  resource: string;
  namespaced: boolean;
}

/** The CRDs the overview walks, in the shape Steve reports them. */
const SCHEMA_SPECS: SchemaSpec[] = [
  {
    id: 'cert-manager.io.certificate', group: 'cert-manager.io', kind: 'Certificate', resource: 'certificates', namespaced: true,
  },
  {
    id: 'cert-manager.io.issuer', group: 'cert-manager.io', kind: 'Issuer', resource: 'issuers', namespaced: true,
  },
  {
    id: 'cert-manager.io.clusterissuer', group: 'cert-manager.io', kind: 'ClusterIssuer', resource: 'clusterissuers', namespaced: false,
  },
  {
    id: 'cert-manager.io.certificaterequest', group: 'cert-manager.io', kind: 'CertificateRequest', resource: 'certificaterequests', namespaced: true,
  },
  {
    id: 'acme.cert-manager.io.order', group: 'acme.cert-manager.io', kind: 'Order', resource: 'orders', namespaced: true,
  },
  {
    id: 'acme.cert-manager.io.challenge', group: 'acme.cert-manager.io', kind: 'Challenge', resource: 'challenges', namespaced: true,
  },
];

function schemaFor(spec: SchemaSpec) {
  return {
    id:    spec.id,
    type:  'schema',
    links: {
      collection: `https://localhost:8005${ V1 }/${ spec.id }`,
      self:       `https://localhost:8005${ V1 }/schemas/${ spec.id }`,
    },
    pluralName:        spec.id,
    resourceMethods:   ['GET', 'DELETE', 'PUT', 'PATCH'],
    resourceFields:    null,
    collectionMethods: ['GET', 'POST'],
    attributes:        {
      group:      spec.group,
      kind:       spec.kind,
      namespaced: spec.namespaced,
      resource:   spec.resource,
      verbs:      ['delete', 'deletecollection', 'get', 'list', 'patch', 'create', 'update', 'watch'],
      version:    'v1',
    },
  };
}

function collectionFor(spec: SchemaSpec, data: any[]) {
  return {
    type:         'collection',
    links:        { self: `https://localhost:8005${ V1 }/${ spec.id }` },
    createTypes:  { [spec.id]: `https://localhost:8005${ V1 }/${ spec.id }` },
    actions:      {},
    resourceType: spec.id,
    revision:     CYPRESS_SAFE_RESOURCE_REVISION,
    count:        data.length,
    data,
  };
}

interface CertOpts {
  name: string;
  namespace?: string;
  /** ISO string for `status.notAfter`; omit for a certificate that has never issued. */
  notAfter?: string;
  ready?: boolean;
  /** Set so the issuance chain (CertificateRequest/Order/Challenge) can be wired back to it. */
  uid?: string;
}

function certificate({
  name, namespace = 'default', notAfter, ready = true, uid
}: CertOpts) {
  const conditions = [{
    type:   'Ready',
    status: ready ? 'True' : 'False',
    reason: ready ? 'Ready' : 'DoesNotExist',
  }];

  return {
    id:         `${ namespace }/${ name }`,
    type:       'cert-manager.io.certificate',
    apiVersion: 'cert-manager.io/v1',
    kind:       'Certificate',
    metadata:   {
      name,
      namespace,
      ...(uid ? { uid } : {}),
      resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
      state:           {
        name: ready ? 'active' : 'error', error: !ready, transitioning: false
      },
    },
    spec:   { secretName: `${ name }-tls`, dnsNames: [`${ name }.example.com`] },
    status: { conditions, ...(notAfter ? { notAfter, renewalTime: notAfter } : {}) },
  };
}

/** A ready state block, shared by the issuance-chain fixtures so every step reads as green. */
const READY_STATE = {
  name: 'active', error: false, transitioning: false
};

/**
 * A CertificateRequest tied to `certName` via the annotation cert-manager uses to reassemble the
 * chain (see utils/issuance). `uid`/`ownerUid` wire it to its parent certificate and its own
 * children.
 */
function certificateRequest(name: string, certName: string, uid: string, ownerUid: string, namespace = 'default') {
  return {
    id:         `${ namespace }/${ name }`,
    type:       'cert-manager.io.certificaterequest',
    apiVersion: 'cert-manager.io/v1',
    kind:       'CertificateRequest',
    metadata:   {
      name,
      namespace,
      uid,
      resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
      annotations:     {
        [CERTIFICATE_NAME_ANNOTATION]:     certName,
        [CERTIFICATE_REVISION_ANNOTATION]: '1',
      },
      ownerReferences: [{
        kind: 'Certificate', name: certName, uid: ownerUid
      }],
      state: READY_STATE,
    },
    spec:   {},
    status: {
      conditions: [
        {
          type: 'Approved', status: 'True', reason: 'cert-manager.io'
        },
        {
          type: 'Ready', status: 'True', reason: 'Issued'
        },
      ],
    },
  };
}

/** An ACME Order owned by a CertificateRequest. */
function order(name: string, uid: string, ownerRequestName: string, ownerUid: string, namespace = 'default') {
  return {
    id:         `${ namespace }/${ name }`,
    type:       'acme.cert-manager.io.order',
    apiVersion: 'acme.cert-manager.io/v1',
    kind:       'Order',
    metadata:   {
      name,
      namespace,
      uid,
      resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
      ownerReferences: [{
        kind: 'CertificateRequest', name: ownerRequestName, uid: ownerUid
      }],
      state: READY_STATE,
    },
    spec:   {},
    status: { state: 'valid' },
  };
}

/** An ACME Challenge owned by an Order. */
function challenge(name: string, ownerOrderName: string, ownerUid: string, namespace = 'default') {
  return {
    id:         `${ namespace }/${ name }`,
    type:       'acme.cert-manager.io.challenge',
    apiVersion: 'acme.cert-manager.io/v1',
    kind:       'Challenge',
    metadata:   {
      name,
      namespace,
      resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
      ownerReferences: [{
        kind: 'Order', name: ownerOrderName, uid: ownerUid
      }],
      state: READY_STATE,
    },
    spec:   { type: 'DNS-01' },
    status: { state: 'valid', processing: false },
  };
}

function issuer(name: string, kind: string, id: string, namespace?: string, configType = 'selfSigned') {
  return {
    id:         namespace ? `${ namespace }/${ name }` : name,
    type:       id,
    apiVersion: 'cert-manager.io/v1',
    kind,
    metadata:   {
      name,
      ...(namespace ? { namespace } : {}),
      resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
      state:           {
        name: 'active', error: false, transitioning: false
      },
    },
    spec:   { [configType]: {} },
    status: {
      conditions: [{
        type: 'Ready', status: 'True', reason: 'Ready'
      }]
    },
  };
}

/** Days from a captured "now", so fixtures land in the intended expiry buckets regardless of run date. */
function daysFromNow(days: number): string {
  return new Date(Date.now() + (days * 86_400_000)).toISOString();
}

function interceptSchemas() {
  cy.intercept('GET', `${ V1 }/schemas?*`, (req) => {
    req.continue((res) => {
      res.body.data = [...res.body.data, ...SCHEMA_SPECS.map(schemaFor)];
      res.send(res.body);
    });
  }).as('certManagerSchemas');
}

function interceptCollections(rows: Record<string, any[]>) {
  SCHEMA_SPECS.forEach((spec) => {
    cy.intercept('GET', `${ V1 }/${ spec.id }?*`, {
      statusCode: 200,
      body:       collectionFor(spec, rows[spec.id] || []),
    }).as(`certManager-${ spec.resource }`);
  });
}

/**
 * Stub the single-resource GET a detail page fires for the resource it was opened on. The
 * collection intercepts only answer `?`-suffixed list URLs; a detail page reached directly loads
 * its own resource by id (`.../<type>/<namespace>/<name>`), which needs its own stub.
 */
function interceptResource(typeId: string, resource: any) {
  const escaped = `${ V1 }/${ typeId }/${ resource.id }`.replace(/[.]/g, '\\.');

  // Match against the request path at the end of the href (Cypress tests RegExps against the full
  // URL, so this stays unanchored at the start).
  cy.intercept('GET', new RegExp(`${ escaped }(\\?.*)?$`), {
    statusCode: 200,
    body:       resource,
  }).as(`certManager-resource-${ resource.id }`);
}

/** Nothing installed yet: certificates and issuers both absent, so the overview shows its empty state. */
export function generateCertManagerEmpty(): void {
  interceptSchemas();
  interceptCollections({});
}

/**
 * Backs the Certificate create form: merges the cert-manager schemas and returns a couple of
 * Issuers (one per scope) so the issuer dropdown has options to pick from.
 */
export function generateCertManagerForCreate(): void {
  interceptSchemas();

  interceptCollections({
    'cert-manager.io.issuer':        [issuer('default-issuer', 'Issuer', 'cert-manager.io.issuer', 'default', 'selfSigned')],
    'cert-manager.io.clusterissuer': [issuer('default-cluster-issuer', 'ClusterIssuer', 'cert-manager.io.clusterissuer', undefined, 'selfSigned')],
  });
}

/**
 * Backs the Issuer/ClusterIssuer create form. Only the schemas are needed for the form to render;
 * the config-type blocks are authored from scratch, so no existing resources are required.
 */
export function generateCertManagerForIssuerCreate(): void {
  interceptSchemas();
  interceptCollections({});
}

/**
 * Backs the Certificate detail page with a full ACME issuance chain
 * (Certificate -> CertificateRequest -> Order -> Challenge) so the Issuance Status card renders
 * every stage and the issuance-history tab lists the request. The certificate is stubbed both as a
 * collection row and by id, since the detail page loads it directly.
 */
export function generateCertManagerCertificateDetail(): void {
  const cert = certificate({
    name: 'web-cert', notAfter: daysFromNow(60), uid: 'uid-cert-web'
  });

  interceptSchemas();
  interceptResource('cert-manager.io.certificate', cert);

  interceptCollections({
    'cert-manager.io.certificate':        [cert],
    'cert-manager.io.certificaterequest': [certificateRequest('web-cert-1', 'web-cert', 'uid-cr-web', 'uid-cert-web')],
    'acme.cert-manager.io.order':         [order('web-cert-1-2842', 'uid-order-web', 'web-cert-1', 'uid-cr-web')],
    'acme.cert-manager.io.challenge':     [challenge('web-cert-1-2842-0', 'web-cert-1-2842', 'uid-order-web')],
  });
}

/**
 * As above, but with no related resources - the certificate is the only stage, so the stepper is
 * suppressed (it only earns its place once there is a chain).
 */
export function generateCertManagerCertificateDetailNoChain(): void {
  const cert = certificate({
    name: 'web-cert', notAfter: daysFromNow(60), uid: 'uid-cert-web'
  });

  interceptSchemas();
  interceptResource('cert-manager.io.certificate', cert);
  interceptCollections({ 'cert-manager.io.certificate': [cert] });
}

/**
 * A deterministic set that lights up every overview widget: certificates across expiry buckets and
 * states, both issuer scopes, and ACME activity.
 */
export function generateCertManagerWithData(): void {
  interceptSchemas();

  interceptCollections({
    'cert-manager.io.certificate': [
      certificate({
        name: 'expired-cert', notAfter: daysFromNow(-2), ready: false
      }),
      certificate({ name: 'urgent-cert', notAfter: daysFromNow(3) }),
      certificate({ name: 'soon-cert', notAfter: daysFromNow(20) }),
      certificate({ name: 'healthy-cert', notAfter: daysFromNow(60) }),
      certificate({ name: 'longlived-cert', notAfter: daysFromNow(200) }),
      certificate({ name: 'pending-cert' }),
    ],
    'cert-manager.io.issuer':        [issuer('letsencrypt', 'Issuer', 'cert-manager.io.issuer', 'default', 'acme')],
    'cert-manager.io.clusterissuer': [issuer('selfsigned-cluster', 'ClusterIssuer', 'cert-manager.io.clusterissuer', undefined, 'selfSigned')],
    'acme.cert-manager.io.order':    [{
      id:       'default/order-1',
      type:     'acme.cert-manager.io.order',
      metadata: {
        name:            'order-1',
        namespace:       'default',
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          name: 'active', error: false, transitioning: false
        }
      },
      status: { state: 'valid' },
    }],
    'acme.cert-manager.io.challenge': [],
  });
}
