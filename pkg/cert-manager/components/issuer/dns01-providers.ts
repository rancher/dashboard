/**
 * Field descriptors for the built-in DNS-01 solver providers, so one generic component can render
 * them all instead of eight near-identical forms.
 *
 * Only the fields listed here are rendered and written. Anything else already present on the
 * provider object is left untouched, which is what keeps hand-written or webhook config intact
 * when a solver is edited through the UI.
 *
 * https://cert-manager.io/docs/configuration/acme/dns01/
 */
export interface ProviderField {
  /** Path within the provider object. Dotted paths address secret refs, e.g. `apiTokenSecretRef.name`. */
  path: string;
  labelKey: string;
  type?: 'text' | 'checkbox';
  required?: boolean;
}

const secretRef = (prefix: string, labelPrefix: string): ProviderField[] => [
  {
    path: `${ prefix }.name`, labelKey: `${ labelPrefix }.name`, required: true
  },
  { path: `${ prefix }.key`, labelKey: `${ labelPrefix }.key` },
];

export const DNS01_PROVIDER_FIELDS: Record<string, ProviderField[]> = {
  cloudflare: [
    { path: 'email', labelKey: 'certManager.dns01.cloudflare.email' },
    ...secretRef('apiTokenSecretRef', 'certManager.dns01.cloudflare.apiToken'),
  ],
  route53: [
    {
      path: 'region', labelKey: 'certManager.dns01.route53.region', required: true
    },
    { path: 'hostedZoneID', labelKey: 'certManager.dns01.route53.hostedZoneID' },
    { path: 'role', labelKey: 'certManager.dns01.route53.role' },
    { path: 'accessKeyID', labelKey: 'certManager.dns01.route53.accessKeyID' },
    ...secretRef('secretAccessKeySecretRef', 'certManager.dns01.route53.secretAccessKey'),
  ],
  azureDNS: [
    {
      path: 'subscriptionID', labelKey: 'certManager.dns01.azureDNS.subscriptionID', required: true
    },
    {
      path: 'resourceGroupName', labelKey: 'certManager.dns01.azureDNS.resourceGroupName', required: true
    },
    { path: 'hostedZoneName', labelKey: 'certManager.dns01.azureDNS.hostedZoneName' },
    { path: 'tenantID', labelKey: 'certManager.dns01.azureDNS.tenantID' },
    { path: 'clientID', labelKey: 'certManager.dns01.azureDNS.clientID' },
    ...secretRef('clientSecretSecretRef', 'certManager.dns01.azureDNS.clientSecret'),
  ],
  cloudDNS: [
    {
      path: 'project', labelKey: 'certManager.dns01.cloudDNS.project', required: true
    },
    ...secretRef('serviceAccountSecretRef', 'certManager.dns01.cloudDNS.serviceAccount'),
  ],
  digitalocean: secretRef('tokenSecretRef', 'certManager.dns01.digitalocean.token'),
  akamai:       [
    {
      path: 'serviceConsumerDomain', labelKey: 'certManager.dns01.akamai.serviceConsumerDomain', required: true
    },
    ...secretRef('clientTokenSecretRef', 'certManager.dns01.akamai.clientToken'),
    ...secretRef('clientSecretSecretRef', 'certManager.dns01.akamai.clientSecret'),
    ...secretRef('accessTokenSecretRef', 'certManager.dns01.akamai.accessToken'),
  ],
  rfc2136: [
    {
      path: 'nameserver', labelKey: 'certManager.dns01.rfc2136.nameserver', required: true
    },
    { path: 'tsigKeyName', labelKey: 'certManager.dns01.rfc2136.tsigKeyName' },
    { path: 'tsigAlgorithm', labelKey: 'certManager.dns01.rfc2136.tsigAlgorithm' },
    ...secretRef('tsigSecretSecretRef', 'certManager.dns01.rfc2136.tsigSecret'),
  ],
};

/** Providers without a descriptor - including `webhook`, whose `config` is free-form. */
export function hasFieldDescriptors(provider?: string): boolean {
  return !!provider && !!DNS01_PROVIDER_FIELDS[provider];
}
