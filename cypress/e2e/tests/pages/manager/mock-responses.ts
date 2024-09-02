export function nodeDriveResponse(addCloudCredential: boolean): any {
  return {
    type:         'collection',
    links:        { self: '/v1/management.cattle.io.nodedrivers' },
    actions:      {},
    resourceType: 'management.cattle.io.nodedriver',
    count:        1,
    data:         [
      {
        id:    'nutanix',
        type:  'management.cattle.io.nodedriver',
        links: {
          remove: 'blocked', self: '/v1/management.cattle.io.nodedrivers/nutanix', update: 'blocked', view: '/v1/management.cattle.io.nodedrivers/nutanix'
        },
        apiVersion: 'management.cattle.io/v3',
        kind:       'NodeDriver',
        metadata:   {
          annotations: {
            'lifecycle.cattle.io/create.node-driver-controller': 'true', privateCredentialFields: 'password', publicCredentialFields: 'endpoint,username,port'
          },
          creationTimestamp: '2024-01-26T18:32:57Z',
          fields:            ['nutanix', '10d'],
          finalizers:        ['controller.cattle.io/node-driver-controller'],
          generation:        5,
          labels:            { 'cattle.io/creator': 'norman' },
          name:              'nutanix',
          relationships:     [{
            toId: 'nutanixcredentialconfig', toType: 'management.cattle.io.dynamicschema', rel: 'owner', state: 'active', message: 'Resource is current'
          }, {
            toId: 'nutanixconfig', toType: 'management.cattle.io.dynamicschema', rel: 'owner', state: 'active', message: 'Resource is current'
          }],
          resourceVersion: '3117786',
          state:           {
            error: false, message: '', name: 'active', transitioning: false
          },
          uid: 'c4da5a49-ecc5-4d74-88a8-1a991a586adb'
        },
        spec: {
          active: true, addCloudCredential, builtin: false, checksum: '65dbf92e2df2b4c6d1a6b1f77c542f2cb13a052a62f236eeee697a1151ede62c', description: '', displayName: 'nutanix', externalId: '', uiUrl: 'https://nutanix.github.io/rancher-ui-driver/v3.4.0/component.js', url: 'https://github.com/nutanix/docker-machine/releases/download/v3.4.0/docker-machine-driver-nutanix', whitelistDomains: ['nutanix.github.io']
        },
        status: {
          appliedChecksum:             '65dbf92e2df2b4c6d1a6b1f77c542f2cb13a052a62f236eeee697a1151ede62c',
          appliedDockerMachineVersion: '',
          appliedURL:                  'https://github.com/nutanix/docker-machine/releases/download/v3.4.0/docker-machine-driver-nutanix',
          conditions:                  [{
            error: false, lastUpdateTime: '2024-02-02T22:14:36Z', status: 'True', transitioning: false, type: 'Active'
          }, {
            error: false, lastUpdateTime: '2024-01-26T18:32:58Z', status: 'True', transitioning: false, type: 'Inactive'
          }, {
            error: false, lastUpdateTime: '2024-02-02T22:14:26Z', status: 'True', transitioning: false, type: 'Downloaded'
          }, {
            error: false, lastUpdateTime: '2024-02-02T22:14:36Z', status: 'True', transitioning: false, type: 'Installed'
          }]
        }
      }]
  };
}
