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
 * The commands to import an existing cluster. When server-url is blank, build them like Rancher would,
 * with a placeholder in place of the server URL.
 */
export function importCommands(serverUrlSetting?: Setting | null, clusterToken?: ClusterRegistrationToken | null): { command: string, insecureCommand: string } {
  if (!clusterToken || !isServerUrlMissing(serverUrlSetting, clusterToken)) {
    return {
      command:         clusterToken?.command || '',
      insecureCommand: clusterToken?.insecureCommand || '',
    };
  }

  const url = `${ SERVER_URL_PLACEHOLDER }/v3/import/${ clusterToken.token }_${ clusterToken.clusterId }.yaml`;

  return {
    command:         `kubectl apply -f ${ url }`,
    insecureCommand: `curl --insecure -sfL ${ url } | kubectl apply -f -`,
  };
}
