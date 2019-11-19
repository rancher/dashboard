export default {
  serviceFromGit: {
    title:       'Create service from Dockerfile',
    description: 'Learn how to use a Dockerfile in our Create Service.',
    createPath:  '/rio/services/create',
    spec:        {
      replicas: 1,
      build:    {
        repo:       'https://github.com/ibuildthecloud/rancher-demo.git',
        revision:   '8272e76852edcb94e1ce501eb555f9e47f892221',
        branch:     'master',
        dockerfile: 'Dockerfile'
      },
      ports: [
        {
          port:       80,
          targetPort: 8080,
          protocol:   'TCP',
          expose:     true,
        },
      ]
    }
  },

  stackFromGit:  {
    title:       'Create stack from Riofile',
    description: 'Learn how to fill out Create Stack and deploy multiple resources using a Riofile.',
    createPath:  '/rio/stack/create',
    spec:        {
      build: {
        repo:     'https://github.com/daxmc99/rio-demo.git',
        revision: 'cb86f2ae38426001ed024db73864e482beedf5ad',
        riofile:  'Riofile'
      }
    }
  },

  autoScaling: {
    title:       'Auto-Scaling',
    description: 'Demo Coming Soon.',
    createPath:  null,
    spec:        null,
  },

  serviceMesh: {
    title:       'Service Mesh',
    description: 'Coming Soon.',
    createPath:  null,
    spec:        null,
  }
};
