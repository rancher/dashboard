import { SMALL_CONTAINER } from '@/cypress/e2e/tests/pages/explorer2/workloads/workload.utils';

/**
 * Resources for the multi-resource YAML editor tests, all in one namespace
 *
 * Each entry is the steve type to create the resource through, and the resource
 */
export type Fixture = [type: string, body: any];

const container = (env: any[] = [], envFrom: any[] = []) => ({
  name: SMALL_CONTAINER.name, image: SMALL_CONTAINER.image, env, envFrom
});

const configMap = (namespace: string, name: string, data: { [key: string]: string } = { key: 'value' }) => ({
  apiVersion: 'v1', kind: 'ConfigMap', metadata: { name, namespace }, data
});

const secret = (namespace: string, name: string) => ({
  apiVersion: 'v1', kind: 'Secret', type: 'Opaque', metadata: { name, namespace }, stringData: { password: 'not-a-real-password' }
});

const claim = (namespace: string, name: string, extra: any = {}) => ({
  apiVersion: 'v1',
  kind:       'PersistentVolumeClaim',
  metadata:   { name, namespace },
  spec:       {
    accessModes: ['ReadWriteOnce'], resources: { requests: { storage: '1Gi' } }, ...extra
  },
});

const deployment = (namespace: string, name: string, podSpec: any) => ({
  apiVersion: 'apps/v1',
  kind:       'Deployment',
  metadata:   { name, namespace },
  spec:       {
    replicas: 1,
    selector: { matchLabels: { app: name } },
    template: {
      metadata: { labels: { app: name } },
      spec:     { terminationGracePeriodSeconds: 0, ...podSpec },
    },
  },
});

const service = (namespace: string, name: string, app: string, extra: any = {}) => ({
  apiVersion: 'v1',
  kind:       'Service',
  metadata:   { name, namespace },
  spec:       {
    selector: { app },
    ports:    [{
      name: 'http', port: 80, targetPort: 80
    }],
    ...extra
  },
});

/**
 * A Deployment, `web`, and the resources it refers to or is used by, to browse in the editor
 *
 * - its pod template names ConfigMaps, Secrets, a claim and a ServiceAccount, and an optional
 *   Secret that does not exist
 * - a Service, HorizontalPodAutoscaler, PodDisruptionBudget and NetworkPolicy select or scale it
 * - an Ingress routes to the Service, and the autoscaler reads a metric of the Ingress, and of a
 *   kind the cluster does not have
 * - a claim cloned from the claim the Deployment mounts
 * - a StatefulSet, `db`, whose controller creates a claim from its volume claim template
 * - a ConfigMap no workload uses
 */
export const browsingFixtures = (namespace: string): Fixture[] => [
  ['configmap', configMap(namespace, 'app-config')],
  ['configmap', configMap(namespace, 'app-env', { MODE: 'production' })],
  ['configmap', configMap(namespace, 'lonely')],
  ['secret', secret(namespace, 'app-credentials')],
  ['secret', secret(namespace, 'registry-pull')],
  ['serviceaccount', {
    apiVersion: 'v1', kind: 'ServiceAccount', metadata: { name: 'app', namespace }
  }],
  ['persistentvolumeclaim', claim(namespace, 'uploads')],
  ['persistentvolumeclaim', claim(namespace, 'uploads-clone', { dataSource: { kind: 'PersistentVolumeClaim', name: 'uploads' } })],
  ['apps.deployment', deployment(namespace, 'web', {
    containers: [container(
      [
        { name: 'PASSWORD', valueFrom: { secretKeyRef: { name: 'app-credentials', key: 'password' } } },
        {
          name:      'OPTIONAL',
          valueFrom: {
            secretKeyRef: {
              name: 'missing-secret', key: 'password', optional: true
            }
          }
        },
      ],
      [{ configMapRef: { name: 'app-env' } }]
    )],
    volumes: [
      { name: 'config', configMap: { name: 'app-config' } },
      { name: 'uploads', persistentVolumeClaim: { claimName: 'uploads' } },
    ],
    imagePullSecrets:   [{ name: 'registry-pull' }],
    serviceAccountName: 'app',
  })],
  ['service', service(namespace, 'web', 'web')],
  ['service', service(namespace, 'db', 'db', { clusterIP: 'None' })],
  ['networking.k8s.io.ingress', {
    apiVersion: 'networking.k8s.io/v1',
    kind:       'Ingress',
    metadata:   { name: 'web', namespace },
    spec:       {
      rules: [{
        host: 'web.example.com',
        http: {
          paths: [{
            path: '/', pathType: 'Prefix', backend: { service: { name: 'web', port: { number: 80 } } }
          }]
        }
      }]
    },
  }],
  ['autoscaling.horizontalpodautoscaler', {
    apiVersion: 'autoscaling/v2',
    kind:       'HorizontalPodAutoscaler',
    metadata:   { name: 'web', namespace },
    spec:       {
      scaleTargetRef: {
        apiVersion: 'apps/v1', kind: 'Deployment', name: 'web'
      },
      minReplicas: 1,
      maxReplicas: 1,
      metrics:     [
        {
          type:   'Object',
          object: {
            describedObject: {
              apiVersion: 'networking.k8s.io/v1', kind: 'Ingress', name: 'web'
            },
            metric: { name: 'requests-per-second' },
            target: { type: 'Value', value: '10' },
          }
        },
        {
          type:   'Object',
          object: {
            describedObject: {
              apiVersion: 'example.io/v1', kind: 'Widget', name: 'unknown-widget'
            },
            metric: { name: 'widgets' },
            target: { type: 'Value', value: '1' },
          }
        },
      ],
    },
  }],
  ['policy.poddisruptionbudget', {
    apiVersion: 'policy/v1',
    kind:       'PodDisruptionBudget',
    metadata:   { name: 'web', namespace },
    spec:       { minAvailable: 0, selector: { matchLabels: { app: 'web' } } },
  }],
  ['networking.k8s.io.networkpolicy', {
    apiVersion: 'networking.k8s.io/v1',
    kind:       'NetworkPolicy',
    metadata:   { name: 'web-allow', namespace },
    spec:       { podSelector: { matchLabels: { app: 'web' } }, policyTypes: ['Ingress'] },
  }],
  ['apps.statefulset', {
    apiVersion: 'apps/v1',
    kind:       'StatefulSet',
    metadata:   { name: 'db', namespace },
    spec:       {
      serviceName: 'db',
      replicas:    1,
      selector:    { matchLabels: { app: 'db' } },
      template:    {
        metadata: { labels: { app: 'db' } },
        spec:     {
          terminationGracePeriodSeconds: 0,
          containers:                    [container([{ name: 'PASSWORD', valueFrom: { secretKeyRef: { name: 'app-credentials', key: 'password' } } }])],
        },
      },
      volumeClaimTemplates: [claim(namespace, 'data')].map(({ metadata, spec }) => ({ metadata: { name: metadata.name }, spec })),
    },
  }],
];

/**
 * An HTTPRoute, for clusters with the gateway api, routing to the `web` Service, mirroring to the
 * `db` Service, and naming the `app-config` ConfigMap in an extension filter
 */
export const routeFixture = (namespace: string): Fixture => ['gateway.networking.k8s.io.httproute', {
  apiVersion: 'gateway.networking.k8s.io/v1',
  kind:       'HTTPRoute',
  metadata:   { name: 'web-route', namespace },
  spec:       {
    parentRefs: [{ name: 'missing-gateway' }],
    rules:      [{
      backendRefs: [{ name: 'web', port: 80 }],
      filters:     [
        { type: 'RequestMirror', requestMirror: { backendRef: { name: 'db', port: 80 } } },
        {
          type:         'ExtensionRef',
          extensionRef: {
            group: '', kind: 'ConfigMap', name: 'app-config'
          }
        },
      ],
    }],
  },
}];

/**
 * A Deployment and the resources it uses, for one save test to edit
 *
 * `prefix` keeps the resources of each test attempt apart, so an edit saved by one is not seen by the next
 */
export const savingFixtures = (namespace: string, prefix: string): Fixture[] => [
  ['configmap', configMap(namespace, `${ prefix }-config`)],
  ['secret', secret(namespace, `${ prefix }-secret`)],
  ['apps.deployment', deployment(namespace, `${ prefix }-app`, {
    containers: [container([{ name: 'PASSWORD', valueFrom: { secretKeyRef: { name: `${ prefix }-secret`, key: 'password' } } }])],
    volumes:    [{ name: 'config', configMap: { name: `${ prefix }-config` } }],
  })],
  ['service', service(namespace, `${ prefix }-app`, `${ prefix }-app`)],
];
