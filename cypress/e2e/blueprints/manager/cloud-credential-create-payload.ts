export function cloudCredentialCreatePayloadDO(credName: string, accessToken: string):object {
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
export function cloudCredentialCreatePayloadAzure(credName: string, environment: string, subscriptionId: string, clientId: string, clientSecret: string):object {
  return {
    type:     'provisioning.cattle.io/cloud-credential',
    metadata: {
      generateName: 'cc-',
      namespace:    'fleet-default'
    },
    _name:                 credName,
    annotations:           { 'provisioning.cattle.io/driver': 'azure' },
    azurecredentialConfig: {
      clientId, clientSecret, environment, subscriptionId
    },
    _type: 'provisioning.cattle.io/cloud-credential',
    name:  credName
  };
}
