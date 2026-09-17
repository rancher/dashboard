import { PaginationHeaderOptions } from '@shell/core/types';
import { STATE, NAME, NAMESPACE, AGE } from '@shell/config/table-headers';

// These lists render client-side (local pagination) - the extension does not opt into server-side
// pagination (see index.ts). So `sort`/`search` may reference any raw field path or model getter,
// with none of the backend-indexing constraints (metadata.fields.N / metadata.state.name) the SSP
// header set required. The STATE column sorts and filters on the model's client-computed state
// (expiring, in-progress, ...), so what the user sorts/filters by matches what the list shows -
// and matches the states the overview buckets are built from.

/** Link to the Issuer or ClusterIssuer named by `spec.issuerRef`. */
const ISSUER_REF = {
  name:          'issuer',
  labelKey:      'certManager.tableHeaders.issuer',
  value:         'spec.issuerRef.name',
  sort:          'spec.issuerRef.name',
  search:        'spec.issuerRef.name',
  formatter:     'LinkDetail',
  formatterOpts: { reference: 'issuerLocation' },
};

const REASON = {
  name:     'reason',
  labelKey: 'certManager.tableHeaders.reason',
  value:    'status.reason',
  sort:     'status.reason',
  search:   'status.reason',
};

export const CERTIFICATE_HEADERS: PaginationHeaderOptions[] = [
  STATE,
  NAME,
  NAMESPACE,
  ISSUER_REF,
  {
    name:          'secret',
    labelKey:      'certManager.tableHeaders.secret',
    value:         'spec.secretName',
    sort:          'spec.secretName',
    search:        'spec.secretName',
    formatter:     'LinkDetail',
    formatterOpts: { reference: 'secretLocation' },
  },
  {
    name:      'dnsNames',
    labelKey:  'certManager.tableHeaders.dnsNames',
    value:     (row: any) => row.dnsNamesDisplay,
    sort:      false,
    search:    false,
    formatter: 'List',
  },
  {
    name:      'expires',
    labelKey:  'certManager.tableHeaders.expires',
    value:     'status.notAfter',
    sort:      'status.notAfter',
    search:    false,
    formatter: 'LiveExpiryDate',
    width:     120,
  },
  {
    name:      'renews',
    labelKey:  'certManager.tableHeaders.renews',
    value:     'status.renewalTime',
    sort:      'status.renewalTime',
    search:    false,
    formatter: 'LiveDate',
    width:     120,
  },
  AGE,
];

const ISSUER_COMMON_HEADERS: PaginationHeaderOptions[] = [
  {
    name:     'configType',
    labelKey: 'certManager.tableHeaders.type',
    value:    (row: any) => row.issuerTypeDisplay,
    sort:     'issuerTypeDisplay',
    search:   'issuerTypeDisplay',
  },
  AGE,
];

export const ISSUER_HEADERS: PaginationHeaderOptions[] = [STATE, NAME, NAMESPACE, ...ISSUER_COMMON_HEADERS];

export const CLUSTER_ISSUER_HEADERS: PaginationHeaderOptions[] = [STATE, NAME, ...ISSUER_COMMON_HEADERS];

export const CERTIFICATE_REQUEST_HEADERS: PaginationHeaderOptions[] = [
  STATE,
  NAME,
  NAMESPACE,
  {
    name:          'certificate',
    labelKey:      'certManager.tableHeaders.certificate',
    value:         (row: any) => row.ownerCertificateName,
    sort:          'ownerCertificateName',
    search:        'ownerCertificateName',
    formatter:     'LinkDetail',
    formatterOpts: { reference: 'ownerCertificateLocation' },
  },
  ISSUER_REF,
  {
    name:      'approved',
    labelKey:  'certManager.tableHeaders.approved',
    value:     (row: any) => row.isApproved,
    sort:      'isApproved',
    search:    false,
    width:     90,
    formatter: 'Checked',
  },
  {
    name:     'revision',
    labelKey: 'certManager.tableHeaders.revision',
    value:    (row: any) => row.revision,
    sort:     'revision',
    search:   false,
    width:    90,
  },
  AGE,
];

export const ORDER_HEADERS: PaginationHeaderOptions[] = [
  STATE,
  NAME,
  NAMESPACE,
  ISSUER_REF,
  {
    name:      'dnsNames',
    labelKey:  'certManager.tableHeaders.dnsNames',
    value:     (row: any) => row.dnsNamesDisplay,
    sort:      false,
    search:    false,
    formatter: 'List',
  },
  REASON,
  AGE,
];

export const CHALLENGE_HEADERS: PaginationHeaderOptions[] = [
  STATE,
  NAME,
  NAMESPACE,
  {
    name:     'dnsName',
    labelKey: 'certManager.tableHeaders.dnsName',
    value:    (row: any) => row.dnsNameDisplay,
    sort:     'spec.dnsName',
    search:   'spec.dnsName',
  },
  {
    name:     'challengeType',
    labelKey: 'certManager.tableHeaders.challengeType',
    value:    'spec.type',
    sort:     'spec.type',
    search:   'spec.type',
    width:    100,
  },
  {
    name:      'presented',
    labelKey:  'certManager.tableHeaders.presented',
    value:     (row: any) => row.isPresented,
    sort:      'isPresented',
    search:    false,
    width:     100,
    formatter: 'Checked',
  },
  // The single most useful field when ACME issuance is stuck.
  REASON,
  AGE,
];
