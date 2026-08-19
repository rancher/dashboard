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
}

function certificate({
  name, namespace = 'default', notAfter, ready = true
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
      resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
      state:           {
        name: ready ? 'active' : 'error', error: !ready, transitioning: false
      },
    },
    spec:   { secretName: `${ name }-tls`, dnsNames: [`${ name }.example.com`] },
    status: { conditions, ...(notAfter ? { notAfter, renewalTime: notAfter } : {}) },
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

/** Nothing installed yet: certificates and issuers both absent, so the overview shows its empty state. */
export function generateCertManagerEmpty(): void {
  interceptSchemas();
  interceptCollections({});
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
