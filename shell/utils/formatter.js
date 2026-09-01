
import { SECRET_TYPES } from '@shell/config/secret';

export function formatEncryptionSecretNames(secrets, chartNamespace) {
  return secrets
    .filter((secret) => (secret.data || {})['encryption-provider-config.yaml'] &&
      secret.metadata.namespace === chartNamespace &&
      !secret.metadata?.state?.error &&
      secret._type === SECRET_TYPES.OPAQUE
    )
    .map((secret) => secret.metadata.name)
    .sort();
}
