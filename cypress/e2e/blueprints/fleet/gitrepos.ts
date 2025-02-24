export const gitRepoCreateRequest = {
  type:     'fleet.cattle.io.gitrepo',
  metadata: {
    namespace: 'fleet-default',
    name:      'fleet-e2e-test-gitrepo',
    labels:    {},
  },
  spec: {
    repo:         'https://github.com/rancher/fleet-test-data.git',
    branch:       'dashboard-e2e-basic',
    paths:        ['simple'],
    correctDrift: { enabled: false },
    targets:      [
      { clusterName: 'some-fake-cluster-id' }
    ],
    insecureSkipTLSVerify: false,
    helmRepoURLRegex:      'https://charts.rancher.io/*',
    helmSecretName:        '',
    clientSecretName:      '',
    pollingInterval:       '13'
  }
};

export function gitRepoTargetAllClustersRequest(
  namespace: string,
  name: string,
  repo: string,
  branch: string,
  path: string
):object {
  return {
    type:     'fleet.cattle.io.gitrepo',
    metadata: {
      namespace,
      name
    },
    spec: {
      repo,
      branch,
      paths:        [path],
      correctDrift: { enabled: false },
      targets:      [{
        clusterSelector: {
          matchExpressions: [{
            key: 'provider.cattle.io', operator: 'NotIn', values: ['harvester']
          }]
        }
      }],
      insecureSkipTLSVerify: false
    }
  };
}
