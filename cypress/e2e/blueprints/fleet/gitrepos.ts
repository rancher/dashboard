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
      { clusterName: 'some-fake-cluster-id' }
    ],
    insecureSkipTLSVerify: false,
    helmRepoURLRegex:      'https://charts.rancher.io/*',
    helmSecretName:        'auth-95j88'
  }
};
