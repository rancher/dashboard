import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

export function machinePoolConfigResponse(clusterName:string, machinePoolId:string ):object {
  return {
    id:    `fleet-default/nc-${ clusterName }-pool1-${ machinePoolId }`,
    type:  'rke-machine-config.cattle.io.digitaloceanconfig',
    links: {
      remove: `https://localhost:8005/v1/rke-machine-config.cattle.io.digitaloceanconfigs/fleet-default/nc-${ clusterName }-pool1-${ machinePoolId }`,
      self:   `https://localhost:8005/v1/rke-machine-config.cattle.io.digitaloceanconfigs/fleet-default/nc-${ clusterName }-pool1-${ machinePoolId }`,
      update: `https://localhost:8005/v1/rke-machine-config.cattle.io.digitaloceanconfigs/fleet-default/nc-${ clusterName }-pool1-${ machinePoolId }`,
      view:   `https://localhost:8005/apis/rke-machine-config.cattle.io/v1/namespaces/fleet-default/digitaloceanconfigs/nc-${ clusterName }-pool1-${ machinePoolId }`
    },
    accessToken: '',
    apiVersion:  'rke-machine-config.cattle.io/v1',
    backups:     false,
    image:       'ubuntu-20-04-x64',
    ipv6:        false,
    kind:        'DigitaloceanConfig',
    metadata:    {
      annotations: {
        'field.cattle.io/creatorId': 'user-x7q4j',
        ownerBindingsCreated:        'true'
      },
      creationTimestamp: '2024-01-06T10:47:28Z',
      fields:            [
        `nc-${ clusterName }-pool1-${ machinePoolId }`,
        '3m36s'
      ],
      generateName:    `nc-${ clusterName }-pool1-`,
      generation:      1,
      name:            `nc-${ clusterName }-pool1-${ machinePoolId }`,
      namespace:       'fleet-default',
      ownerReferences: [
        {
          apiVersion:         'provisioning.cattle.io/v1',
          blockOwnerDeletion: true,
          controller:         true,
          kind:               'Cluster',
          name:               clusterName,
          uid:                '6ef2f4fa-8391-405d-bb2b-f93d71a043d3'
        }
      ],
      relationships: [
        {
          fromId:        `fleet-default/${ clusterName }`,
          fromType:      'provisioning.cattle.io.cluster',
          rel:           'owner',
          state:         'updating',
          message:       `configuring bootstrap node(s) ${ clusterName }-pool1-5486598fb8xpg8j9-dm8c5: waiting for probes: calico`,
          transitioning: true
        },
        {
          toId:    `fleet-default/nc-${ clusterName }-pool1-${ machinePoolId }-digitaloceanconfigs-a`,
          toType:  'rbac.authorization.k8s.io.role',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    `fleet-default/nc-${ clusterName }-pool1-${ machinePoolId }-digitaloceanconfigs-a`,
          toType:  'rbac.authorization.k8s.io.rolebinding',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        }
      ],
      resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
      state:           {
        error:         false,
        message:       'Resource is current',
        name:          'active',
        transitioning: false
      },
      uid: '11f6e148-063a-455e-88bf-682da1ff89f1'
    },
    monitoring:        false,
    privateNetworking: false,
    region:            'sfo3',
    size:              's-4vcpu-16gb-amd',
    sshKeyContents:    '',
    sshKeyFingerprint: '',
    sshPort:           '22',
    sshUser:           'root',
    tags:              '',
    userdata:          ''
  };
}
