import { STATE, NAME, NAMESPACE, AGE } from '@shell/config/table-headers';

/**
 * The shape the shell's list views accept. `HeaderOptions` in `@shell/core/types` is a narrower,
 * extension-facing subset that omits `dashIfEmpty`, `align` and array `search`, and
 * `@shell/config/table-headers` is plain JS, so there is no accurate type to import.
 */
export interface TableHeader {
  name: string;
  label?: string;
  labelKey?: string;
  value?: string;
  getValue?: (row: any) => any;
  sort?: string | string[] | boolean;
  search?: string | string[] | boolean;
  formatter?: string;
  formatterOpts?: Record<string, any>;
  dashIfEmpty?: boolean;
  align?: string;
  width?: number;
  default?: string;
  canBeVariable?: boolean;
}

/** Link to the Issuer or ClusterIssuer named by `spec.issuerRef`. */
const ISSUER_REF = {
  name:          'issuer',
  labelKey:      'certManager.tableHeaders.issuer',
  value:         'spec.issuerRef.name',
  sort:          ['spec.issuerRef.name'],
  search:        ['spec.issuerRef.name'],
  dashIfEmpty:   true,
  formatter:     'LinkDetail',
  formatterOpts: { reference: 'issuerLocation' },
};

const REASON = {
  name:        'reason',
  labelKey:    'certManager.tableHeaders.reason',
  value:       'status.reason',
  sort:        ['status.reason'],
  dashIfEmpty: true,
};

export const CERTIFICATE_HEADERS: TableHeader[] = [
  STATE,
  NAME,
  NAMESPACE,
  ISSUER_REF,
  {
    name:          'secret',
    labelKey:      'certManager.tableHeaders.secret',
    value:         'spec.secretName',
    sort:          ['spec.secretName'],
    dashIfEmpty:   true,
    formatter:     'LinkDetail',
    formatterOpts: { reference: 'secretLocation' },
  },
  {
    name:      'dnsNames',
    labelKey:  'certManager.tableHeaders.dnsNames',
    getValue:  (row: any) => row.dnsNamesDisplay,
    sort:      false,
    search:    ['spec.commonName', 'spec.dnsNames'],
    formatter: 'List',
  },
  {
    name:      'expires',
    labelKey:  'certManager.tableHeaders.expires',
    value:     'status.notAfter',
    sort:      ['status.notAfter'],
    search:    false,
    formatter: 'LiveExpiryDate',
    width:     120,
  },
  {
    name:      'renews',
    labelKey:  'certManager.tableHeaders.renews',
    value:     'status.renewalTime',
    sort:      ['status.renewalTime'],
    search:    false,
    formatter: 'LiveDate',
    width:     120,
  },
  AGE,
];

const ISSUER_COMMON_HEADERS: TableHeader[] = [
  {
    name:        'configType',
    labelKey:    'certManager.tableHeaders.type',
    getValue:    (row: any) => row.configTypeDisplay,
    sort:        false,
    search:      false,
    dashIfEmpty: true,
  },
  {
    name:        'acmeServer',
    labelKey:    'certManager.tableHeaders.acmeServer',
    getValue:    (row: any) => row.acmeServerDisplay,
    sort:        ['spec.acme.server'],
    search:      ['spec.acme.server'],
    dashIfEmpty: true,
  },
  {
    name:     'certificates',
    labelKey: 'certManager.tableHeaders.certificates',
    getValue: (row: any) => row.certificates.length,
    sort:     false,
    search:   false,
    align:    'right',
    width:    110,
  },
  AGE,
];

export const ISSUER_HEADERS: TableHeader[] = [STATE, NAME, NAMESPACE, ...ISSUER_COMMON_HEADERS];

export const CLUSTER_ISSUER_HEADERS: TableHeader[] = [STATE, NAME, ...ISSUER_COMMON_HEADERS];

export const CERTIFICATE_REQUEST_HEADERS: TableHeader[] = [
  STATE,
  NAME,
  NAMESPACE,
  {
    name:          'certificate',
    labelKey:      'certManager.tableHeaders.certificate',
    getValue:      (row: any) => row.ownerCertificateName,
    sort:          false,
    dashIfEmpty:   true,
    formatter:     'LinkDetail',
    formatterOpts: { reference: 'ownerCertificateLocation' },
  },
  ISSUER_REF,
  {
    name:      'approved',
    labelKey:  'certManager.tableHeaders.approved',
    getValue:  (row: any) => row.isApproved,
    sort:      false,
    search:    false,
    align:     'center',
    width:     90,
    formatter: 'Checked',
  },
  {
    name:        'revision',
    labelKey:    'certManager.tableHeaders.revision',
    getValue:    (row: any) => row.revision,
    sort:        false,
    search:      false,
    align:       'right',
    width:       90,
    dashIfEmpty: true,
  },
  AGE,
];

export const ORDER_HEADERS: TableHeader[] = [
  STATE,
  NAME,
  NAMESPACE,
  ISSUER_REF,
  {
    name:      'dnsNames',
    labelKey:  'certManager.tableHeaders.dnsNames',
    getValue:  (row: any) => row.dnsNamesDisplay,
    sort:      false,
    search:    ['spec.commonName', 'spec.dnsNames'],
    formatter: 'List',
  },
  REASON,
  {
    name:     'challenges',
    labelKey: 'certManager.tableHeaders.challenges',
    getValue: (row: any) => row.challenges.length,
    sort:     false,
    search:   false,
    align:    'right',
    width:    110,
  },
  AGE,
];

export const CHALLENGE_HEADERS: TableHeader[] = [
  STATE,
  NAME,
  NAMESPACE,
  {
    name:     'dnsName',
    labelKey: 'certManager.tableHeaders.dnsName',
    getValue: (row: any) => row.dnsNameDisplay,
    sort:     ['spec.dnsName'],
    search:   ['spec.dnsName'],
  },
  {
    name:     'challengeType',
    labelKey: 'certManager.tableHeaders.challengeType',
    value:    'spec.type',
    sort:     ['spec.type'],
    width:    100,
  },
  {
    name:      'presented',
    labelKey:  'certManager.tableHeaders.presented',
    getValue:  (row: any) => row.isPresented,
    sort:      false,
    search:    false,
    align:     'center',
    width:     100,
    formatter: 'Checked',
  },
  // The single most useful field when ACME issuance is stuck.
  REASON,
  AGE,
];
