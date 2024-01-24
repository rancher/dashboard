// At some point these will come from somewhere central, then we can make tools to remove resources from this or all runs
const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }-`;

export const createPodBlueprint = {
  apiVersion: 'v1',
  kind:       'Pod',
  metadata:   { name: `${ runPrefix }nginx-test-pod`, namespace: 'default' },
  spec:       {
    containers: [
      {
        name:      'nginx',
        image:     'nginx',
        resources: {
          requests: {
            cpu:    '200m',
            memory: '512Mi'
          },
          limits: {
            cpu:    '500m',
            memory: '1Gi'
          }
        }
      }
    ]
  }
};

export const clonePodBlueprint = {
  apiVersion: 'v1',
  kind:       'Pod',
  metadata:   { name: `${ runPrefix }nginx-test-clone`, namespace: 'default' },
};
