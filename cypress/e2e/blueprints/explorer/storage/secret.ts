export const ociSecretCreateRequest = (namespace: string, name: string) => ({
  type:       'fleet.cattle.io/bundle-oci-storage/v1alpha1',
  apiVersion: 'v1',
  data:       {
    agentPassword: 'Zm9v',
    agentUsername: 'ZmxlZXQtY2k=',
    basicHTTP:     'ZmFsc2U=',
    insecure:      'dHJ1ZQ==',
    password:      'Zm9v',
    reference:     '',
    username:      'ZmxlZXQtY2k='
  },
  kind:     'Secret',
  metadata: {
    name,
    namespace
  }
});
