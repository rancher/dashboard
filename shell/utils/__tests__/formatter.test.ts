import { formatEncryptionSecretNames } from '@shell/utils/formatter';

describe('formatter', () => {
  const secrets = [
    {
      id:       'test5',
      _type:    'Opaque',
      data:     { hash: 'test5', 'encryption-provider-config.yaml': 'MTIzNFFhYWEh' },
      metadata: {
        name:      'test5',
        namespace: 'test',
        state:     {
          error: false, message: 'Resource is always ready', name: 'active', transitioning: false
        }
      }
    },
    {
      id:       'test2',
      _type:    'Opaque',
      data:     { hash: 'test', 'encryption-provider-config.yaml': 'MTIzNFFhYWEh' },
      metadata: {
        name:      'test2',
        namespace: 'test',
        state:     {
          error: false, message: 'Resource is always ready', name: 'active', transitioning: false
        }
      }
    },
    {
      id:       'test4',
      _type:    'Opaque',
      data:     { hash: 'test4' },
      metadata: {
        name:      'test4',
        namespace: 'test',
        state:     {
          error: false, message: 'Resource is always ready', name: 'active', transitioning: false
        }
      }
    },
    {
      id:       'test1',
      _type:    'Custom',
      data:     { hash: 'test1', 'encryption-provider-config.yaml': 'MTIzNFFhYWEh' },
      metadata: {
        name:      'test1',
        namespace: 'test',
        state:     {
          error: false, message: 'Resource is always ready', name: 'active', transitioning: false
        },
      }
    },
    {
      id:       'test6',
      _type:    'Opaque',
      data:     { hash: 'test5', 'encryption-provider-config.yaml': 'MTIzNFFhYWEh' },
      metadata: {
        name:      'test5',
        namespace: 'test',
        state:     {
          error: true, message: 'Failed', name: 'active', transitioning: true
        }
      }
    }];
  const chart = 'test';

  it.each([[chart, 2], ['test1', 0]])('should show correct number of secrets', (chartVal: string, result: number) => {
    const res = formatEncryptionSecretNames(secrets, chartVal);

    expect(res).toHaveLength(result);
  });
  it('should return correct results in a correct order', () => {
    const res = formatEncryptionSecretNames(secrets, chart);

    expect(res).toStrictEqual(['test2', 'test5']);
  });
});
