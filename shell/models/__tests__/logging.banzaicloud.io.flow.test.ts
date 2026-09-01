import LogFlow from '@shell/models/logging.banzaicloud.io.flow';

describe('class LogFlow', () => {
  it('prop "outputs" should take namespace in consideration when filtering logging v2 "outputs"', () => {
    const logOutputs = [
      {
        apiVersion: 'logging.banzaicloud.io/v1beta1',
        kind:       'Output',
        metadata:   {
          creationTimestamp: '2025-03-17T10:51:55Z',
          namespace:         'default',
          name:              'output1',
          uid:               '927b4a2e-6be0-476f-9bdd-cf30c4a27d8b'
        },
        name:   'output1',
        spec:   { awsElasticsearch: { endpoint: {} } },
        status: { active: false }
      },
      {
        apiVersion: 'logging.banzaicloud.io/v1beta1',
        kind:       'Output',
        metadata:   {
          creationTimestamp: '2025-03-17T10:51:55Z',
          namespace:         'cattle-fleet-system',
          name:              'output2',
          uid:               '927b4a2e-6be0-476f-9bdd-cf30c4a27d8c'
        },
        name:   'output2',
        spec:   { awsElasticsearch: { endpoint: {} } },
        status: { active: false }
      },
      {
        apiVersion: 'logging.banzaicloud.io/v1beta1',
        kind:       'Output',
        metadata:   {
          creationTimestamp: '2025-03-17T10:51:55Z',
          namespace:         'cattle-fleet-system',
          name:              'output3',
          uid:               '927b4a2e-6be0-476f-9bdd-cf30c4a27d8d'
        },
        name:   'output3',
        spec:   { awsElasticsearch: { endpoint: {} } },
        status: { active: false }
      },
      {
        apiVersion: 'logging.banzaicloud.io/v1beta1',
        kind:       'Output',
        metadata:   {
          creationTimestamp: '2025-03-17T10:51:55Z',
          namespace:         'kube-system',
          name:              'output4',
          uid:               '927b4a2e-6be0-476f-9bdd-cf30c4a27d8e'
        },
        name:   'output4',
        spec:   { awsElasticsearch: { endpoint: {} } },
        status: { active: false }
      },
    ];

    const logFlowData = {
      apiVersion: 'logging.banzaicloud.io/v1beta1',
      kind:       'Flow',
      metadata:   {
        name:              'flow2',
        creationTimestamp: '2025-03-17T10:53:02Z',
        generation:        1,
        namespace:         'cattle-fleet-system',
        resourceVersion:   '4070',
        uid:               'fdf7d553-d101-4c37-91b0-784f95dc950a',
        fields:            [
          'flow2', true, null
        ]
      },
      spec: {
        localOutputRefs: [
          'output2',
          'output3'
        ]
      }
    };

    const logFlow = new LogFlow(logFlowData);

    jest.spyOn(logFlow, 'allOutputs', 'get').mockReturnValue(logOutputs);

    expect(logFlow.outputs).toStrictEqual([logOutputs[1], logOutputs[2]]);
  });
});
