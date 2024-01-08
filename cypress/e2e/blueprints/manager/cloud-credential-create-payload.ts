export function cloudCredentialCreatePayload(credName: string, accessToken: string):object {
  return {
    type:     'provisioning.cattle.io/cloud-credential',
    metadata: {
      generateName: 'cc-',
      namespace:    'fleet-default'
    },
    _name:                        credName,
    annotations:                  { 'provisioning.cattle.io/driver': 'digitalocean' },
    digitaloceancredentialConfig: { accessToken },
    _type:                        'provisioning.cattle.io/cloud-credential',
    name:                         credName
  };
}
