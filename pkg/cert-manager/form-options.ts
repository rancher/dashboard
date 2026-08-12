/**
 * Fixed option lists for the create/edit forms.
 * https://cert-manager.io/docs/reference/api-docs/
 */
export const ISSUER_GROUP = 'cert-manager.io';

export const ISSUER_KINDS = {
  ISSUER:         'Issuer',
  CLUSTER_ISSUER: 'ClusterIssuer',
} as const;

export const KEY_ALGORITHMS = ['RSA', 'ECDSA', 'Ed25519'];

/** Ed25519 has a single fixed key size, so cert-manager rejects `size` for it entirely. */
export const KEY_SIZES: Record<string, number[]> = {
  RSA:   [2048, 3072, 4096],
  ECDSA: [256, 384, 521],
};

export const KEY_ENCODINGS = ['PKCS1', 'PKCS8'];

export const ROTATION_POLICIES = ['Never', 'Always'];

export const KEY_USAGES = [
  'signing',
  'digital signature',
  'content commitment',
  'key encipherment',
  'key agreement',
  'data encipherment',
  'cert sign',
  'crl sign',
  'encipher only',
  'decipher only',
  'any',
  'server auth',
  'client auth',
  'code signing',
  'email protection',
  'timestamping',
  'ocsp signing',
];

/**
 * Applied to new certificates only.
 *
 * The private key fields match what cert-manager would pick anyway, so writing them changes
 * nothing about issuance - they just make the form show the values that will actually be used
 * instead of four empty inputs.
 *
 * `rotationPolicy` is the exception: it is a deliberate opinion. cert-manager defaults older
 * installs to `Never`, which reuses the existing key on every renewal; `Always` is the documented
 * recommendation and is the default for new certificates in recent releases.
 */
export const CERTIFICATE_DEFAULTS = {
  privateKey: {
    algorithm:      'RSA',
    size:           2048,
    encoding:       'PKCS1',
    rotationPolicy: 'Always',
  },
};

export const ISSUER_CONFIG_TYPES = ['selfSigned', 'ca', 'acme', 'vault', 'venafi'] as const;

export type IssuerConfigType = typeof ISSUER_CONFIG_TYPES[number];

/** Seed written to `spec.<type>` when the user picks a config type. */
export const ISSUER_CONFIG_DEFAULTS: Record<IssuerConfigType, () => Record<string, any>> = {
  selfSigned: () => ({}),
  ca:         () => ({ secretName: '' }),
  acme:       () => ({
    server: '', privateKeySecretRef: { name: '' }, solvers: []
  }),
  vault: () => ({
    server: '', path: '', auth: {}
  }),
  venafi: () => ({ zone: '' }),
};

export const WELL_KNOWN_ACME_SERVERS = [
  { label: 'Let\'s Encrypt', value: 'https://acme-v02.api.letsencrypt.org/directory' },
  { label: 'Let\'s Encrypt (Staging)', value: 'https://acme-staging-v02.api.letsencrypt.org/directory' },
  { label: 'ZeroSSL', value: 'https://acme.zerossl.com/v2/DV90' },
  { label: 'Buypass', value: 'https://api.buypass.com/acme/directory' },
];

export const CHALLENGE_TYPES = {
  HTTP01: 'http01',
  DNS01:  'dns01',
} as const;

/**
 * DNS-01 providers with a dedicated form. Anything else (including `webhook`) falls back to a
 * free-form editor so unknown provider config is never destroyed.
 */
export const DNS01_PROVIDERS = [
  'cloudflare',
  'route53',
  'azureDNS',
  'cloudDNS',
  'digitalocean',
  'akamai',
  'rfc2136',
  'webhook',
];
