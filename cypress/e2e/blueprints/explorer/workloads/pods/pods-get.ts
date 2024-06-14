// GET /v1/pods - small set of pods data
const podsGetResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29.qa.rancher.space/v1/pods' },
  createTypes:  { pod: 'https://yonasb29.qa.rancher.space/v1/pods' },
  actions:      {},
  resourceType: 'pod',
  revision:     '123',
  count:        3,
  data:         [
    {
      id:    'cattle-fleet-local-system/fleet-agent-0',
      type:  'pod',
      links: {
        remove: 'https://yonasb29.qa.rancher.space/v1/pods/cattle-fleet-local-system/fleet-agent-0',
        self:   'https://yonasb29.qa.rancher.space/v1/pods/cattle-fleet-local-system/fleet-agent-0',
        update: 'https://yonasb29.qa.rancher.space/v1/pods/cattle-fleet-local-system/fleet-agent-0',
        view:   'https://yonasb29.qa.rancher.space/api/v1/namespaces/cattle-fleet-local-system/pods/fleet-agent-0'
      },
      apiVersion: 'v1',
      kind:       'Pod',
      metadata:   {
        annotations:       {},
        creationTimestamp: '2024-06-14T15:50:07Z',
        fields:            [
          'fleet-agent-0',
          '2/2',
          'Running',
          '0',
          '7h29m',
          '10.42.2.15',
          'ip-172-31-12-33.us-east-2.compute.internal',
          '<none>',
          '<none>'
        ],
        generateName:    'fleet-agent-',
        labels:          {},
        name:            'aaa-e2e-vai-test-pod-name',
        namespace:       'cattle-fleet-local-system',
        ownerReferences: [],
        relationships:   [],
        resourceVersion: '7553',
        state:           {
          error:         false,
          message:       '',
          name:          'running',
          transitioning: false
        },
        uid: '76de6052-8eda-42bc-98d5-dd19c335e977'
      },
      spec: {
        affinity: {
          nodeAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                preference: {
                  matchExpressions: [
                    {
                      key:      'fleet.cattle.io/agent',
                      operator: 'In',
                      values:   [
                        'true'
                      ]
                    }
                  ]
                },
                weight: 1
              }
            ]
          }
        },
        containers:         [],
        dnsPolicy:          'ClusterFirst',
        enableServiceLinks: true,
        hostname:           'fleet-agent-0',
        initContainers:     [],
        nodeName:           'ip-172-31-12-33.us-east-2.compute.internal',
        nodeSelector:       { 'kubernetes.io/os': 'linux' },
        preemptionPolicy:   'PreemptLowerPriority',
        priority:           0,
        restartPolicy:      'Always',
        schedulerName:      'default-scheduler',
        securityContext:    {
          runAsGroup:   1000,
          runAsNonRoot: true,
          runAsUser:    1000
        },
        serviceAccount:                'fleet-agent',
        serviceAccountName:            'fleet-agent',
        subdomain:                     'fleet-agent',
        terminationGracePeriodSeconds: 30,
        tolerations:                   [],
        volumes:                       []
      },
      status: {}
    },
    {
      id:    'kube-system/rke2-snapshot-controller-59cc9cd8f4-dr2nv',
      type:  'pod',
      links: {
        remove: 'https://yonasb29.qa.rancher.space/v1/pods/kube-system/rke2-snapshot-controller-59cc9cd8f4-dr2nv',
        self:   'https://yonasb29.qa.rancher.space/v1/pods/kube-system/rke2-snapshot-controller-59cc9cd8f4-dr2nv',
        update: 'https://yonasb29.qa.rancher.space/v1/pods/kube-system/rke2-snapshot-controller-59cc9cd8f4-dr2nv',
        view:   'https://yonasb29.qa.rancher.space/api/v1/namespaces/kube-system/pods/rke2-snapshot-controller-59cc9cd8f4-dr2nv'
      },
      apiVersion: 'v1',
      kind:       'Pod',
      metadata:   {
        annotations: {
          'cni.projectcalico.org/containerID': '212cd9f120c58c007d065f7702a2f3f6c7f2f8e8850af7ed14f56ef577c61615',
          'cni.projectcalico.org/podIP':       '10.42.0.11/32',
          'cni.projectcalico.org/podIPs':      '10.42.0.11/32'
        },
        creationTimestamp: '2024-06-14T15:39:59Z',
        fields:            [
          'rke2-snapshot-controller-59cc9cd8f4-dr2nv',
          '1/1',
          'Running',
          '0',
          '7h39m',
          '10.42.0.11',
          'ip-172-31-14-130.us-east-2.compute.internal',
          '<none>',
          '<none>'
        ],
        generateName:    'rke2-snapshot-controller-59cc9cd8f4-',
        labels:          {},
        name:            'rke2-snapshot-controller-59cc9cd8f4-dr2nv',
        namespace:       'kube-system',
        ownerReferences: [],
        relationships:   [],
        resourceVersion: '1176',
        state:           {
          error:         false,
          message:       '',
          name:          'running',
          transitioning: false
        },
        uid: 'a2157217-0b62-4d95-adcd-686f79925d4d'
      },
      spec: {
        containers:                    [],
        dnsPolicy:                     'ClusterFirst',
        enableServiceLinks:            true,
        nodeName:                      'ip-172-31-14-130.us-east-2.compute.internal',
        nodeSelector:                  { 'kubernetes.io/os': 'linux' },
        preemptionPolicy:              'PreemptLowerPriority',
        priority:                      0,
        restartPolicy:                 'Always',
        schedulerName:                 'default-scheduler',
        securityContext:               {},
        serviceAccount:                'rke2-snapshot-controller',
        serviceAccountName:            'rke2-snapshot-controller',
        terminationGracePeriodSeconds: 30,
        tolerations:                   [],
        volumes:                       []
      },
      status: {}
    },
    {
      id:    'kube-system/rke2-snapshot-validation-webhook-54c5989b65-87xqh',
      type:  'pod',
      links: {
        remove: 'https://yonasb29.qa.rancher.space/v1/pods/kube-system/rke2-snapshot-validation-webhook-54c5989b65-87xqh',
        self:   'https://yonasb29.qa.rancher.space/v1/pods/kube-system/rke2-snapshot-validation-webhook-54c5989b65-87xqh',
        update: 'https://yonasb29.qa.rancher.space/v1/pods/kube-system/rke2-snapshot-validation-webhook-54c5989b65-87xqh',
        view:   'https://yonasb29.qa.rancher.space/api/v1/namespaces/kube-system/pods/rke2-snapshot-validation-webhook-54c5989b65-87xqh'
      },
      apiVersion: 'v1',
      kind:       'Pod',
      metadata:   {
        annotations:       {},
        creationTimestamp: '2024-06-14T15:39:52Z',
        fields:            [
          'rke2-snapshot-validation-webhook-54c5989b65-87xqh',
          '1/1',
          'Running',
          '0',
          '7h39m',
          '10.42.0.9',
          'ip-172-31-14-130.us-east-2.compute.internal',
          '<none>',
          '<none>'
        ],
        generateName:    'rke2-snapshot-validation-webhook-54c5989b65-',
        labels:          {},
        name:            'rke2-snapshot-validation-webhook-54c5989b65-87xqh',
        namespace:       'kube-system',
        ownerReferences: [],
        relationships:   [],
        resourceVersion: '1138',
        state:           {
          error:         false,
          message:       '',
          name:          'running',
          transitioning: false
        },
        uid: '929106df-13d9-43fc-9c76-09ad0292aab1'
      },
      spec: {
        containers:                    [],
        dnsPolicy:                     'ClusterFirst',
        enableServiceLinks:            true,
        nodeName:                      'ip-172-31-14-130.us-east-2.compute.internal',
        nodeSelector:                  { 'kubernetes.io/os': 'linux' },
        preemptionPolicy:              'PreemptLowerPriority',
        priority:                      0,
        restartPolicy:                 'Always',
        schedulerName:                 'default-scheduler',
        securityContext:               {},
        serviceAccount:                'rke2-snapshot-validation-webhook',
        serviceAccountName:            'rke2-snapshot-validation-webhook',
        terminationGracePeriodSeconds: 30,
        tolerations:                   [],
        volumes:                       []
      },
      status: {}
    }
  ]
};

function reply(statusCode: number, body: any) {
  return (req) => {
    req.reply({
      statusCode,
      body
    });
  };
}

export function generatePodsDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/pods?*', reply(200, podsGetResponseSmallSet)).as('podsDataSmall');
}
