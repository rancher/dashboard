export const CERT_MANAGER = {
  CERTIFICATE:         'cert-manager.io.certificate',
  ISSUER:              'cert-manager.io.issuer',
  CLUSTER_ISSUER:      'cert-manager.io.clusterissuer',
  CERTIFICATE_REQUEST: 'cert-manager.io.certificaterequest',
  ORDER:               'acme.cert-manager.io.order',
  CHALLENGE:           'acme.cert-manager.io.challenge',
} as const;
