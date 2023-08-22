
const OPAQUE_SECRET_TYPE = 'Opaque';

export function formatEncryptionSecretNames(secrets, chartNamespace) {
  return secrets.filter(
    (secret) => (secret.data || {})['encryption-provider-config.yaml'] &&
        secret.metadata.namespace === chartNamespace &&
        !secret.metadata?.state?.error &&
        !!secret.metadata?.name &&
        secret._type === OPAQUE_SECRET_TYPE
  ).map((secret) => secret.metadata.name).sort();
}
