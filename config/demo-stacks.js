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
      repo:     'https://github.com/daxmc99/rio-demo.git',
      revision: '03094af324bb8e8a72e34394089ab796692a9358',
      riofile:  'Riofile'
    }
  }
};
