export default {
  serviceFromGit: {
    replicas: 1,
    build:    {
      repo:       'https://github.com/ibuildthecloud/rancher-demo.git',
      revision:   '8272e76852edcb94e1ce501eb555f9e47f892221',
      branch:     'master',
      dockerfile: 'Dockerfile'
    }
  },

  stackFromGit:  {
    build: {
      repo:     'https://github.com/rancher-max/riofile-demo.git',
      branch:   'master',
      revision: '4f229a31977ccdc3afff12f8fe16ef46a491d70c',
      riofile:  'Riofile'
    }
  }
};
