export default {
  serviceFromGit: {
    title:       'Deploy service from Dockerfile',
    description: 'Clicking deploy will prefill the image section of Service with a Dockerfile.',
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
    title:       'Create stack from GitHub',
    description: 'Deploying a stack allows multiple resources to be deployed at once and updated through a rio file you keep in GitHub. Clicking deploy will pre-fill the stack fields with a demo rio file.',
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
    description: 'Coming Soon.',
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
