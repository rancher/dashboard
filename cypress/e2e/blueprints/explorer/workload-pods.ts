export const createPodBlueprint = {
  apiVersion: 'v1',
  kind:       'Pod',
  metadata:   { name: 'nginx-test-pod', namespace: 'default' },
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
  metadata:   { name: 'nginx-test-clone', namespace: 'default' },
};
