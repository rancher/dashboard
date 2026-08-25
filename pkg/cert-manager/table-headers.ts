import { PaginationHeaderOptions } from '@shell/core/types';
import { STEVE_STATE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL, STEVE_AGE_COL } from '@shell/config/pagination-table-headers';

// These lists render under server-side pagination (see `enableServerSidePagination` in index.ts).
// Under SSP `sort`/`search` MUST be paths to fields the backend indexes: metadata.name/namespace,
// metadata.state.name, metadata.creationTimestamp (all carried by the STEVE_* columns) and each
// CRD's additionalPrinterColumns, exposed as `metadata.fields.N`. `metadata.fields.0` is always the
// Name; the rest follow the CRD's printer-column order, so the index is per-CRD (an issuer column is
// not the same index across Certificate, CertificateRequest and Order) and version-fragile - verify
// against the CRD's additionalPrinterColumns when touching these.
//
// Fields with no printer column stay display-only (`sort`/`search: false`). The notable gap is
// expiry (`status.notAfter`/`status.renewalTime`): not printer columns, so sorting on them needs the
// backend to index them first (tracked in the SQLite-cache indexing request).

/** Link to the Issuer or ClusterIssuer named by `spec.issuerRef`. */
const ISSUER_REF = {
  name:          'issuer',
  labelKey:      'certManager.tableHeaders.issuer',
  value:         'spec.issuerRef.name',
  sort:          false,
  search:        false,
  formatter:     'LinkDetail',
  formatterOpts: { reference: 'issuerLocation' },
};

const REASON = {
  name:     'reason',
  labelKey: 'certManager.tableHeaders.reason',
  value:    'status.reason',
  sort:     false,
  search:   false,
};

export const CERTIFICATE_HEADERS: PaginationHeaderOptions[] = [
  STEVE_STATE_COL,
  STEVE_NAME_COL,
  STEVE_NAMESPACE_COL,
  // Certificate additionalPrinterColumns: [Name(0), Ready(1), Secret(2), Issuer(3), Status(4), Age(5)].
  {
    ...ISSUER_REF,
    sort:   'metadata.fields.3', // spec.issuerRef.name
    search: 'metadata.fields.3',
  },
  {
    name:          'secret',
    labelKey:      'certManager.tableHeaders.secret',
    value:         'spec.secretName',
    sort:          'metadata.fields.2', // spec.secretName
    search:        'metadata.fields.2',
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
    sort:      false,
    search:    false,
    formatter: 'LiveExpiryDate',
    width:     120,
  },
  {
    name:      'renews',
    labelKey:  'certManager.tableHeaders.renews',
    value:     'status.renewalTime',
    sort:      false,
    search:    false,
    formatter: 'LiveDate',
    width:     120,
  },
  STEVE_AGE_COL,
];

const ISSUER_COMMON_HEADERS: PaginationHeaderOptions[] = [
  {
    name:     'configType',
    labelKey: 'certManager.tableHeaders.type',
    value:    (row: any) => row.issuerTypeDisplay,
    sort:     false,
    search:   false,
  },
  STEVE_AGE_COL,
];

export const ISSUER_HEADERS: PaginationHeaderOptions[] = [STEVE_STATE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL, ...ISSUER_COMMON_HEADERS];

export const CLUSTER_ISSUER_HEADERS: PaginationHeaderOptions[] = [STEVE_STATE_COL, STEVE_NAME_COL, ...ISSUER_COMMON_HEADERS];

export const CERTIFICATE_REQUEST_HEADERS: PaginationHeaderOptions[] = [
  STEVE_STATE_COL,
  STEVE_NAME_COL,
  STEVE_NAMESPACE_COL,
  {
    name:          'certificate',
    labelKey:      'certManager.tableHeaders.certificate',
    value:         (row: any) => row.ownerCertificateName,
    sort:          false,
    search:        false,
    formatter:     'LinkDetail',
    formatterOpts: { reference: 'ownerCertificateLocation' },
  },
  // CertificateRequest additionalPrinterColumns:
  // [Name(0), Approved(1), Denied(2), Ready(3), Issuer(4), Requester(5), Status(6), Age(7)].
  {
    ...ISSUER_REF,
    sort:   'metadata.fields.4', // spec.issuerRef.name
    search: 'metadata.fields.4',
  },
  {
    name:      'approved',
    labelKey:  'certManager.tableHeaders.approved',
    value:     (row: any) => row.isApproved,
    sort:      'metadata.fields.1', // status Approved condition
    search:    'metadata.fields.1',
    width:     90,
    formatter: 'Checked',
  },
  {
    name:     'revision',
    labelKey: 'certManager.tableHeaders.revision',
    value:    (row: any) => row.revision,
    sort:     false, // no printer column
    search:   false,
    width:    90,
  },
  STEVE_AGE_COL,
];

export const ORDER_HEADERS: PaginationHeaderOptions[] = [
  STEVE_STATE_COL,
  STEVE_NAME_COL,
  STEVE_NAMESPACE_COL,
  // Order additionalPrinterColumns: [Name(0), State(1), Issuer(2), Reason(3), Age(4)].
  {
    ...ISSUER_REF,
    sort:   'metadata.fields.2', // spec.issuerRef.name
    search: 'metadata.fields.2',
  },
  {
    name:      'dnsNames',
    labelKey:  'certManager.tableHeaders.dnsNames',
    value:     (row: any) => row.dnsNamesDisplay,
    sort:      false, // no printer column
    search:    false,
    formatter: 'List',
  },
  {
    ...REASON,
    sort:   'metadata.fields.3', // status.reason
    search: 'metadata.fields.3',
  },
  STEVE_AGE_COL,
];

export const CHALLENGE_HEADERS: PaginationHeaderOptions[] = [
  STEVE_STATE_COL,
  STEVE_NAME_COL,
  STEVE_NAMESPACE_COL,
  // Challenge additionalPrinterColumns: [Name(0), State(1), Domain(2), Reason(3), Age(4)].
  {
    name:     'dnsName',
    labelKey: 'certManager.tableHeaders.dnsName',
    value:    (row: any) => row.dnsNameDisplay,
    sort:     'metadata.fields.2', // spec.dnsName
    search:   'metadata.fields.2',
  },
  {
    name:     'challengeType',
    labelKey: 'certManager.tableHeaders.challengeType',
    value:    'spec.type',
    sort:     false, // no printer column
    search:   false,
    width:    100,
  },
  {
    name:      'presented',
    labelKey:  'certManager.tableHeaders.presented',
    value:     (row: any) => row.isPresented,
    sort:      false, // no printer column
    search:    false,
    width:     100,
    formatter: 'Checked',
  },
  // The single most useful field when ACME issuance is stuck.
  {
    ...REASON,
    sort:   'metadata.fields.3', // status.reason
    search: 'metadata.fields.3',
  },
  STEVE_AGE_COL,
];
