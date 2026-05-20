import { base64Decode } from '@shell/utils/crypto';

export interface DockerAuthEntry {
  username?: string;
  password?: string;
  auth?: string;
  email?: string;
}

/**
 * Extracts username and password from a docker auth entry.
 * The entry may have explicit `username`/`password` fields, or a base64-encoded
 * `auth` field in the format `username:password` (as produced by `docker login`).
 * Explicit fields take precedence over the `auth` field.
 */
export const extractDockerAuthCredentials = (authEntry: DockerAuthEntry = {}): { username?: string; password?: string } => {
  if (authEntry.username !== undefined || authEntry.password !== undefined) {
    return {
      username: authEntry.username,
      password: authEntry.password,
    };
  }

  if (authEntry.auth) {
    const decoded = base64Decode(authEntry.auth);
    const separatorIndex = decoded.indexOf(':');

    if (separatorIndex !== -1) {
      return {
        username: decoded.substring(0, separatorIndex),
        password: decoded.substring(separatorIndex + 1),
      };
    }
  }

  return {
    username: undefined,
    password: undefined,
  };
};
