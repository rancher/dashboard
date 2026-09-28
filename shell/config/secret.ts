export const SECRET_TYPES = {
  OPAQUE:            'Opaque',
  SERVICE_ACCT:      'kubernetes.io/service-account-token',
  DOCKER_JSON:       'kubernetes.io/dockerconfigjson',
  BASIC:             'kubernetes.io/basic-auth',
  SSH:               'kubernetes.io/ssh-auth',
  TLS:               'kubernetes.io/tls',
  BOOTSTRAP:         'bootstrap.kubernetes.io/token',
  ISTIO_TLS:         'istio.io/key-and-cert',
  HELM_RELEASE:      'helm.sh/release.v1',
  FLEET_CLUSTER:     'fleet.cattle.io/cluster-registration-values',
  CLOUD_CREDENTIAL:  'provisioning.cattle.io/cloud-credential',
  RKE_AUTH_CONFIG:   'rke.cattle.io/auth-config',
  FLEET_OCI_STORAGE: 'fleet.cattle.io/bundle-oci-storage/v1alpha1'
};

/**
 * Data keys for a Fleet GitHub App authentication secret (stored as an Opaque secret).
 * Shared so the create flows stay in sync.
 */
export const GITHUB_APP_SECRET_KEYS = {
  APP_ID:          'github_app_id',
  INSTALLATION_ID: 'github_app_installation_id',
  PRIVATE_KEY:     'github_app_private_key',
};
