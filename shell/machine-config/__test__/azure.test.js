
import Azure from '@shell/machine-config/azure.vue';
import { NORMAN } from '@shell/config/types';

describe('component: azure', () => {
  it('test locationOptions & environment & location & environment when loadedCredentialIdFor equals credentialId', async() => {
    const value = { location: 'local1' };
    const localThis = {
      credentialId:          'test',
      loadedCredentialIdFor: 'test',
      value,
      initTags:              () => {},
      setLocation:           (location) => {
        value.location = location?.name;
      },
      $store: {
        dispatch: (type) => {
          const dis = {
            'rancher/findAll': [{
              id:                    'test',
              azurecredentialConfig: { environment: 'environment' },
              type:                  NORMAN.CLOUD_CREDENTIAL
            }],
            'management/request': [{ name: 'local2', type: '/meta/aksLocations' }]
          };

          return dis[type];
        }

      }
    };

    await Azure.fetch.call(localThis);
    expect(localThis.value.environment).toBeUndefined();
    expect(localThis.locationOptions).toBeUndefined();
    expect(localThis.value.location).toBe('local1');
  });

  it('test locationOptions & environment & location & environment when loadedCredentialIdFor is not equal to credentialId', async() => {
    const value = { location: 'local1' };
    const localThis = {
      credentialId: 'test',
      value,
      initTags:     () => {},
      setLocation:  (location) => {
        value.location = location?.name;
      },
      $store: {
        dispatch: (type) => {
          const dis = {
            'rancher/findAll': [{
              id:                    'test',
              azurecredentialConfig: { environment: 'environment' },
              type:                  NORMAN.CLOUD_CREDENTIAL
            }],
            'management/request': [{ name: 'local2', type: '/meta/aksLocations' }]
          };

          return dis[type];
        }

      }
    };

    await Azure.fetch.call(localThis);
    expect(localThis.value.environment).toBe('environment');
    expect(localThis.loadedCredentialIdFor).toBe('test');
    expect(localThis.locationOptions).toStrictEqual([{ name: 'local2', type: '/meta/aksLocations' }]);
    expect(localThis.value.location).toBe('local2');
  });
});
