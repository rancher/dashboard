import { formatEncryptionSecretNames } from '@shell/utils/formatter';

describe('formatter', () => {
  const secrets = [
    {
      id:    'test5',
      type:  'secret',
      links: {
        remove: 'https://test5:8000', self: 'https://test5:8000', update: 'https://test5:8000', view: 'https://test5:8000'
      },
      _type:      'Opaque',
      apiVersion: 'v1',
      data:       { hash: 'test5', 'encryption-provider-config.yaml': 'MTIzNFFhYWEh' },
      immutable:  true,
      kind:       'Secret',
      metadata:   {
        annotations:       { 'field.cattle.io/projectId': 'test' },
        creationTimestamp: '2023-06-26T22:51:42Z',
        fields:            ['Opaque', 1, '56d'],
        name:              'test5',
        namespace:         'test',
        relationships:     null,
        resourceVersion:   '4306',
        state:             {
          error: false, message: 'Resource is always ready', name: 'active', transitioning: false
        },
        uid: 'fcc4aa44-ce0c-4a7d-bd67-e77040b889a8'
      }
    },
    {
      id:    'test2',
      type:  'secret',
      links: {
        remove: 'https://test2:8000', self: 'https://test2:8000', update: 'https://test2:8000', view: 'https://test2:8000'
      },
      _type:      'Opaque',
      apiVersion: 'v1',
      data:       { hash: 'test', 'encryption-provider-config.yaml': 'MTIzNFFhYWEh' },
      immutable:  true,
      kind:       'Secret',
      metadata:   {
        annotations:       { 'field.cattle.io/projectId': 'test' },
        creationTimestamp: '2023-06-26T22:51:42Z',
        fields:            ['Opaque', 1, '56d'],
        name:              'test2',
        namespace:         'test',
        relationships:     null,
        resourceVersion:   '4306',
        state:             {
          error: false, message: 'Resource is always ready', name: 'active', transitioning: false
        },
        uid: 'fcc4aa44-ce0c-4a7d-bd67-e77040b889a7'
      }
    },
    {
      id:    'test4',
      type:  'secret',
      links: {
        remove: 'https://test4:8000', self: 'https://test4:8000', update: 'https://test4:8000', view: 'https://test4:8000'
      },
      _type:      'Opaque',
      apiVersion: 'v1',
      data:       { hash: 'test4' },
      immutable:  true,
      kind:       'Secret',
      metadata:   {
        annotations:       { 'field.cattle.io/projectId': 'test4' },
        creationTimestamp: '2023-06-26T22:51:42Z',
        fields:            ['Opaque', 1, '56d'],
        name:              'test4',
        namespace:         'test',
        relationships:     null,
        resourceVersion:   '4306',
        state:             {
          error: false, message: 'Resource is always ready', name: 'active', transitioning: false
        },
        uid: 'fcc4aa44-ce0c-4a7d-bd67-e77040b889a6'
      }
    },
    {
      id:    'test1',
      type:  'secret',
      links: {
        remove: 'https://test1:8000', self: 'https://test1:8000', update: 'https://test1:8000', view: 'https://test1:8000'
      },
      _type:      'Custom',
      apiVersion: 'v1',
      data:       { hash: 'test1', 'encryption-provider-config.yaml': 'MTIzNFFhYWEh' },
      immutable:  true,
      kind:       'Secret',
      metadata:   {
        annotations:       { 'field.cattle.io/projectId': 'test' },
        creationTimestamp: '2023-06-26T22:51:42Z',
        fields:            [1, '56d'],
        name:              'test1',
        namespace:         'test',
        relationships:     null,
        resourceVersion:   '4306',
        state:             {
          error: false, message: 'Resource is always ready', name: 'active', transitioning: false
        },
        uid: 'fcc4aa44-ce0c-4a7d-bd67-e77040b889a9'
      }
    },
    {
      id:    'test3',
      type:  'secret',
      links: {
        remove: 'https://test3:8000', self: 'https://test3:8000', update: 'https://test3:8000', view: 'https://test3:8000'
      },
      _type:      'Opaque',
      apiVersion: 'v1',
      data:       { hash: 'test', 'encryption-provider-config.yaml': 'MTIzNFFhYWEh' },
      immutable:  true,
      kind:       'Secret',
      metadata:   {
        annotations:       { 'field.cattle.io/projectId': 'test' },
        creationTimestamp: '2023-06-26T22:51:42Z',
        fields:            ['Opaque', 1, '56d'],
        namespace:         'test',
        relationships:     null,
        resourceVersion:   '4306',
        state:             {
          error: false, message: 'Resource is always ready', name: 'active', transitioning: false
        },
        uid: 'fcc4aa44-ce0c-4a7d-bd67-e77040b889a6'
      }
    }];
  const chart = 'test';
  const testCases = [[chart, 2], ['test1', 0]];

  it.each(testCases)( 'should show correct number of secrets', ( chartVal: string, result: number) => {
    const res = formatEncryptionSecretNames(secrets, chartVal);

    expect(res).toHaveLength(result);
  });
  it('should return correct results in a correct order', () => {
    const res = formatEncryptionSecretNames(secrets, chart);

    expect(res[0]).toBe('test2');
    expect(res[1]).toBe('test5');
  });
});
