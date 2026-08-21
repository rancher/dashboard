import { PaginationHeaderOptions } from '@shell/core/types';
import { STEVE_STATE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL, STEVE_AGE_COL } from '@shell/config/pagination-table-headers';

// These lists render under server-side pagination (see `enableServerSidePagination` in index.ts).
// Under SSP `sort`/`search` MUST be paths to fields the backend indexes - by default only
// metadata.name/namespace, metadata.state.name, metadata.creationTimestamp and any CRD
// additionalPrinterColumns. None of the cert-manager spec/status fields below are indexed, so they
// are display-only (`sort`/`search: false`); the STEVE_* columns carry the sortable/searchable
// paths. Sorting by expiry (`status.notAfter`/`status.renewalTime`) is the notable gap and needs
// the backend to index those fields before it can be re-enabled here.

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
  ISSUER_REF,
  {
    name:          'secret',
    labelKey:      'certManager.tableHeaders.secret',
    value:         'spec.secretName',
    sort:          false,
    search:        false,
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
  ISSUER_REF,
  {
    name:      'approved',
    labelKey:  'certManager.tableHeaders.approved',
    value:     (row: any) => row.isApproved,
    sort:      false,
    search:    false,
    width:     90,
    formatter: 'Checked',
  },
  {
    name:     'revision',
    labelKey: 'certManager.tableHeaders.revision',
    value:    (row: any) => row.revision,
    sort:     false,
    search:   false,
    width:    90,
  },
  STEVE_AGE_COL,
];

export const ORDER_HEADERS: PaginationHeaderOptions[] = [
  STEVE_STATE_COL,
  STEVE_NAME_COL,
  STEVE_NAMESPACE_COL,
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
  STEVE_AGE_COL,
];

export const CHALLENGE_HEADERS: PaginationHeaderOptions[] = [
  STEVE_STATE_COL,
  STEVE_NAME_COL,
  STEVE_NAMESPACE_COL,
  {
    name:     'dnsName',
    labelKey: 'certManager.tableHeaders.dnsName',
    value:    (row: any) => row.dnsNameDisplay,
    sort:     false,
    search:   false,
  },
  {
    name:     'challengeType',
    labelKey: 'certManager.tableHeaders.challengeType',
    value:    'spec.type',
    sort:     false,
    search:   false,
    width:    100,
  },
  {
    name:      'presented',
    labelKey:  'certManager.tableHeaders.presented',
    value:     (row: any) => row.isPresented,
    sort:      false,
    search:    false,
    width:     100,
    formatter: 'Checked',
  },
  // The single most useful field when ACME issuance is stuck.
  REASON,
  STEVE_AGE_COL,
];
