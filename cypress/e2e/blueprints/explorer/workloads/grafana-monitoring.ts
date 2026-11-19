export const PODMONITOR_SCHEMA_ID = 'monitoring.coreos.com.podmonitor';

export const CLUSTER_GRAFANA = { namespace: 'cattle-monitoring-system', name: 'rancher-monitoring-grafana' };

export const projectGrafana = (projectId: string) => ({ namespace: `cattle-project-${ projectId }-monitoring`, name: `cattle-project-${ projectId }-monitoring-grafana` });

export const podMonitorSchema = {
  id:    PODMONITOR_SCHEMA_ID,
  type:  'schema',
  links: {
    collection: '/v1/monitoring.coreos.com.podmonitors',
    self:       `/v1/schemas/${ PODMONITOR_SCHEMA_ID }`
  },
  pluralName:        'monitoring.coreos.com.podmonitors',
  resourceMethods:   ['GET', 'DELETE', 'PUT', 'PATCH'],
  resourceFields:    null,
  collectionMethods: ['GET', 'POST'],
  attributes:        {
    crd:        true,
    group:      'monitoring.coreos.com',
    kind:       'PodMonitor',
    namespaced: true,
    resource:   'podmonitors',
    verbs:      ['delete', 'deletecollection', 'get', 'list', 'patch', 'create', 'update', 'watch'],
    version:    'v1'
  }
};

export const grafanaEndpoint = ({ namespace, name }: { namespace: string, name: string }) => ({
  id:         `${ namespace }/${ name }`,
  type:       'endpoints',
  apiVersion: 'v1',
  kind:       'Endpoints',
  metadata:   {
    name,
    namespace,
    resourceVersion: '1'
  },
  subsets: [{
    addresses: [{ ip: '10.42.0.10' }],
    ports:     [{
      name: 'service', port: 3000, protocol: 'TCP'
    }]
  }]
});

export const isGrafanaEndpoint = (endpoint: { id: string }) => /^(cattle-monitoring-system\/rancher-monitoring-grafana|cattle-project-[^/]+-monitoring\/cattle-project-[^/]+-monitoring-grafana)$/.test(endpoint.id);
