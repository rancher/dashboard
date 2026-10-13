export const SERVER_URL_PLACEHOLDER = '<SERVER_URL>';

interface ClusterRegistrationToken {
  clusterId?: string;
  token?: string;
  command?: string;
  insecureCommand?: string;
}

interface Setting {
  value?: string;
}

/**
 * Rancher only fills in the registration commands when the server-url setting is set.
 *
 * Both checks are needed: a token that was just created has no commands yet even when server-url is set,
 * and a setting the user can't read doesn't tell us anything.
 */
export function isServerUrlMissing(serverUrlSetting?: Setting | null, clusterToken?: ClusterRegistrationToken | null): boolean {
  return !!serverUrlSetting && !serverUrlSetting.value && !!clusterToken?.token && !clusterToken.command;
}

/**
 * The import manifest URL, built the way Rancher builds it: the server URL with its path replaced.
 */
function importUrl(serverUrl: string, clusterToken: ClusterRegistrationToken): string {
  const path = `/v3/import/${ clusterToken.token }_${ clusterToken.clusterId }.yaml`;

  try {
    return `${ new URL(serverUrl).origin }${ path }`;
  } catch {
    return `${ serverUrl.replace(/\/+$/, '') }${ path }`;
  }
}

/**
 * The commands to import an existing cluster.
 *
 * Rancher doesn't regenerate the commands of an existing token when server-url is set later, so build them here
 * whenever the token has none: from server-url when it's set, otherwise with a placeholder.
 */
export function importCommands(serverUrlSetting?: Setting | null, clusterToken?: ClusterRegistrationToken | null): { command: string, insecureCommand: string } {
  if (!serverUrlSetting || !clusterToken?.token || clusterToken.command) {
    return {
      command:         clusterToken?.command || '',
      insecureCommand: clusterToken?.insecureCommand || '',
    };
  }

  const url = importUrl(serverUrlSetting.value || SERVER_URL_PLACEHOLDER, clusterToken);

  return {
    command:         `kubectl apply -f ${ url }`,
    insecureCommand: `curl --insecure -sfL ${ url } | kubectl apply -f -`,
  };
}
