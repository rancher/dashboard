export const gitRepoCreateRequest = {
  type:     'fleet.cattle.io.gitrepo',
  metadata: {
    namespace: 'fleet-default',
    name:      'fleet-e2e-test-gitrepo'
  },
  spec: {
    repo:         'https://github.com/rancher/fleet-test-data.git',
    branch:       'dashboard-e2e-basic',
    paths:        ['simple'],
    correctDrift: { enabled: false },
    targets:      [
      {
        clusterSelector: {
          matchExpressions: [
            {
              key:      'provider.cattle.io',
              operator: 'NotIn',
              values:   [
                'harvester'
              ]
            }
          ]
        }
      }
    ],
    insecureSkipTLSVerify: false,
    helmRepoURLRegex:      'https://charts.rancher.io/*',
    helmSecretName:        'auth-95j88'
  }
};
