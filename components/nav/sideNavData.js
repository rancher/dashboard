const sideNavData = [
  {
    name:        'cluster',
    label:       'Cluster',
    weight:      99,
    defaultType: '__vue_devtool_undefined__',
    children:    [
      {
        label:        'Cluster Dashboard',
        labelDisplay: 'Cluster Dashboard',
        mode:         'basic',
        count:        '__vue_devtool_undefined__',
        exact:        true,
        namespaced:   false,
        route:        {
          name:   'c-cluster-explorer',
          params: {
            cluster: 'c-m-f6ltlnw5',
            product: 'explorer'
          }
        },
        name:     'cluster-dashboard',
        weight:   100,
        overview: true
      },
      {
        label:        'Projects/Namespaces',
        labelDisplay: '<i class="icon icon-fw icon-globe"></i>Projects/Namespaces',
        mode:         'basic',
        count:        '__vue_devtool_undefined__',
        exact:        true,
        namespaced:   false,
        route:        {
          name:   'c-cluster-product-projectsnamespaces',
          params: {
            cluster: 'c-m-f6ltlnw5',
            product: 'explorer'
          }
        },
        name:     'projects-namespaces',
        weight:   98,
        overview: false
      },
      {
        label:        'Nodes',
        labelDisplay: '<i class="icon icon-fw icon-globe"></i>Nodes',
        mode:         'basic',
        count:        4,
        exact:        false,
        namespaced:   false,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'node'
          }
        },
        name:     'node',
        weight:   0,
        overview: false
      },
      {
        label:        'Cluster Members',
        labelDisplay: '<i class="icon icon-fw icon-globe"></i>Cluster Members',
        mode:         'basic',
        count:        '__vue_devtool_undefined__',
        exact:        true,
        namespaced:   false,
        route:        {
          name:   'c-cluster-product-members',
          params: {
            cluster: 'c-m-f6ltlnw5',
            product: 'explorer'
          }
        },
        name:     'cluster-members',
        weight:   -1,
        overview: false
      }
    ]
  },
  {
    name:        'workload',
    label:       'Workload',
    weight:      98,
    defaultType: '__vue_devtool_undefined__',
    children:    [
      {
        label:        ' Workloads ',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i> Workloads ',
        mode:         'basic',
        count:        '__vue_devtool_undefined__',
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            resource: 'workload',
            cluster:  'c-m-f6ltlnw5',
            product:  'explorer'
          }
        },
        name:     'workload',
        weight:   99,
        overview: true
      },
      {
        label:        'CronJobs',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>CronJobs',
        mode:         'basic',
        count:        0,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'batch.cronjob'
          }
        },
        name:     'batch.cronjob',
        weight:   0,
        overview: false
      },
      {
        label:        'DaemonSets',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>DaemonSets',
        mode:         'basic',
        count:        0,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'apps.daemonset'
          }
        },
        name:     'apps.daemonset',
        weight:   0,
        overview: false
      },
      {
        label:        'Deployments',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>Deployments',
        mode:         'basic',
        count:        3,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'apps.deployment'
          }
        },
        name:     'apps.deployment',
        weight:   0,
        overview: false
      },
      {
        label:        'Jobs',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>Jobs',
        mode:         'basic',
        count:        0,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'batch.job'
          }
        },
        name:     'batch.job',
        weight:   0,
        overview: false
      },
      {
        label:        'StatefulSets',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>StatefulSets',
        mode:         'basic',
        count:        2,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'apps.statefulset'
          }
        },
        name:     'apps.statefulset',
        weight:   0,
        overview: false
      },
      {
        label:        'Pods',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>Pods',
        mode:         'basic',
        count:        5,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'pod'
          }
        },
        name:     'pod',
        weight:   -1,
        overview: false
      }
    ]
  },
  {
    name:     'apps',
    label:    'Apps',
    children: [
      {
        label:        'Charts',
        labelDisplay: '<i class="icon icon-fw icon-compass"></i>Charts',
        mode:         'basic',
        count:        '__vue_devtool_undefined__',
        exact:        false,
        namespaced:   false,
        route:        {
          name:   'c-cluster-apps-charts',
          params: {
            cluster: 'c-m-f6ltlnw5',
            product: 'apps'
          }
        },
        name:     'charts',
        weight:   100,
        overview: false
      },
      {
        label:        'Installed Apps',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>Installed Apps',
        mode:         'basic',
        count:        2,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'apps',
            cluster:  'c-m-f6ltlnw5',
            resource: 'catalog.cattle.io.app'
          }
        },
        name:     'catalog.cattle.io.app',
        weight:   99,
        overview: false
      },
      {
        label:        'Repositories',
        labelDisplay: '<i class="icon icon-fw icon-globe"></i>Repositories',
        mode:         'basic',
        count:        3,
        exact:        false,
        namespaced:   false,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'apps',
            cluster:  'c-m-f6ltlnw5',
            resource: 'catalog.cattle.io.clusterrepo'
          }
        },
        name:     'catalog.cattle.io.clusterrepo',
        weight:   0,
        overview: false
      },
      {
        label:        'Recent Operations',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>Recent Operations',
        mode:         'basic',
        count:        0,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'apps',
            cluster:  'c-m-f6ltlnw5',
            resource: 'catalog.cattle.io.operation'
          }
        },
        name:     'catalog.cattle.io.operation',
        weight:   0,
        overview: false
      }
    ],
    weight: 97
  },
  {
    name:        'serviceDiscovery',
    label:       'Service Discovery',
    weight:      96,
    defaultType: 'service',
    children:    [
      {
        label:        'HorizontalPodAutoscalers',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>HorizontalPodAutoscalers',
        mode:         'basic',
        count:        0,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'autoscaling.horizontalpodautoscaler'
          }
        },
        name:     'autoscaling.horizontalpodautoscaler',
        weight:   0,
        overview: false
      },
      {
        label:        'Ingresses',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>Ingresses',
        mode:         'basic',
        count:        0,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'networking.k8s.io.ingress'
          }
        },
        name:     'networking.k8s.io.ingress',
        weight:   0,
        overview: false
      },
      {
        label:        'NetworkPolicies',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>NetworkPolicies',
        mode:         'basic',
        count:        3,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'networking.k8s.io.networkpolicy'
          }
        },
        name:     'networking.k8s.io.networkpolicy',
        weight:   0,
        overview: false
      },
      {
        label:        'Services',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>Services',
        mode:         'basic',
        count:        8,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'service'
          }
        },
        name:     'service',
        weight:   0,
        overview: false
      }
    ]
  },
  {
    name:        'storage',
    label:       'Storage',
    weight:      95,
    defaultType: '__vue_devtool_undefined__',
    children:    [
      {
        label:        'PersistentVolumes',
        labelDisplay: '<i class="icon icon-fw icon-globe"></i>PersistentVolumes',
        mode:         'basic',
        count:        0,
        exact:        false,
        namespaced:   false,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'persistentvolume'
          }
        },
        name:     'persistentvolume',
        weight:   0,
        overview: false
      },
      {
        label:        'StorageClasses',
        labelDisplay: '<i class="icon icon-fw icon-globe"></i>StorageClasses',
        mode:         'basic',
        count:        0,
        exact:        false,
        namespaced:   false,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'storage.k8s.io.storageclass'
          }
        },
        name:     'storage.k8s.io.storageclass',
        weight:   0,
        overview: false
      },
      {
        label:        'ConfigMaps',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>ConfigMaps',
        mode:         'basic',
        count:        30,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'configmap'
          }
        },
        name:     'configmap',
        weight:   0,
        overview: false
      },
      {
        label:        'PersistentVolumeClaims',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>PersistentVolumeClaims',
        mode:         'basic',
        count:        0,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'persistentvolumeclaim'
          }
        },
        name:     'persistentvolumeclaim',
        weight:   0,
        overview: false
      },
      {
        label:        'Secrets',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>Secrets',
        mode:         'basic',
        count:        29,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'explorer',
            cluster:  'c-m-f6ltlnw5',
            resource: 'secret'
          }
        },
        name:     'secret',
        weight:   0,
        overview: false
      }
    ]
  },
  {
    name:     'monitoring',
    label:    'Monitoring',
    children: [
      {
        label:        'Monitoring',
        labelDisplay: 'Monitoring',
        mode:         'basic',
        count:        '__vue_devtool_undefined__',
        exact:        true,
        namespaced:   false,
        route:        {
          name:   'c-cluster-monitoring',
          params: {
            cluster: 'c-m-f6ltlnw5',
            product: 'monitoring'
          }
        },
        name:     'monitoring-overview',
        weight:   105,
        overview: true
      },
      {
        label:        'Monitors',
        labelDisplay: '<i class="icon icon-fw icon-globe"></i>Monitors',
        mode:         'basic',
        count:        '__vue_devtool_undefined__',
        exact:        false,
        namespaced:   '__vue_devtool_undefined__',
        route:        {
          name:   'c-cluster-monitoring-monitor',
          params: {
            cluster: 'c-m-f6ltlnw5',
            product: 'monitoring'
          }
        },
        name:     'monitor',
        weight:   1,
        overview: false
      },
      {
        label:        'Project Monitors',
        labelDisplay: '<i class="icon icon-fw icon-folder"></i>Project Monitors',
        mode:         'basic',
        count:        1,
        exact:        false,
        namespaced:   true,
        route:        {
          name:   'c-cluster-product-resource',
          params: {
            product:  'monitoring',
            cluster:  'c-m-f6ltlnw5',
            resource: 'helm.cattle.io.projecthelmchart'
          }
        },
        name:     'helm.cattle.io.projecthelmchart',
        weight:   0,
        overview: false
      },
      {
        name:        'Alerting',
        label:       'Alerting',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'AlertmanagerConfigs',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>AlertmanagerConfigs',
            mode:         'basic',
            count:        3,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'monitoring',
                cluster:  'c-m-f6ltlnw5',
                resource: 'monitoring.coreos.com.alertmanagerconfig'
              }
            },
            name:     'monitoring.coreos.com.alertmanagerconfig',
            weight:   2,
            overview: false
          },
          {
            label:        'Routes and Receivers',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>Routes and Receivers',
            mode:         'basic',
            count:        '__vue_devtool_undefined__',
            exact:        false,
            namespaced:   '__vue_devtool_undefined__',
            route:        {
              name:   'c-cluster-monitoring-route-receiver',
              params: {
                cluster: 'c-m-f6ltlnw5',
                product: 'monitoring'
              }
            },
            name:     'route-receiver',
            weight:   1,
            overview: false
          }
        ]
      },
      {
        name:        'Advanced',
        label:       'Advanced',
        weight:      -1,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'PrometheusRules',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>PrometheusRules',
            mode:         'basic',
            count:        5,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'monitoring',
                cluster:  'c-m-f6ltlnw5',
                resource: 'monitoring.coreos.com.prometheusrule'
              }
            },
            name:     'monitoring.coreos.com.prometheusrule',
            weight:   102,
            overview: false
          },
          {
            label:        'Prometheis',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>Prometheis',
            mode:         'basic',
            count:        1,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'monitoring',
                cluster:  'c-m-f6ltlnw5',
                resource: 'monitoring.coreos.com.prometheus'
              }
            },
            name:     'monitoring.coreos.com.prometheus',
            weight:   0,
            overview: false
          }
        ]
      }
    ],
    weight: 90
  },
  {
    name:     'legacy',
    label:    'Legacy',
    children: [
      {
        label:        'Alerts',
        labelDisplay: 'Alerts',
        mode:         'basic',
        count:        '__vue_devtool_undefined__',
        exact:        true,
        namespaced:   true,
        route:        {
          name:   'c-cluster-legacy-pages-page',
          params: {
            page:    'alerts',
            cluster: 'c-m-f6ltlnw5',
            product: 'legacy'
          }
        },
        name:     'v1-alerts',
        weight:   111,
        overview: false
      },
      {
        label:        'Catalogs',
        labelDisplay: 'Catalogs',
        mode:         'basic',
        count:        '__vue_devtool_undefined__',
        exact:        true,
        namespaced:   true,
        route:        {
          name:   'c-cluster-legacy-pages-page',
          params: {
            page:    'catalogs',
            cluster: 'c-m-f6ltlnw5',
            product: 'legacy'
          }
        },
        name:     'v1-catalogs',
        weight:   111,
        overview: false
      },
      {
        label:        'CIS Scans',
        labelDisplay: 'CIS Scans',
        mode:         'basic',
        count:        '__vue_devtool_undefined__',
        exact:        true,
        namespaced:   true,
        route:        {
          name:   'c-cluster-legacy-pages-page',
          params: {
            page:    'cis',
            cluster: 'c-m-f6ltlnw5',
            product: 'legacy'
          }
        },
        name:     'v1-cis-scans',
        weight:   111,
        overview: false
      },
      {
        label:        'Notifiers',
        labelDisplay: 'Notifiers',
        mode:         'basic',
        count:        '__vue_devtool_undefined__',
        exact:        true,
        namespaced:   true,
        route:        {
          name:   'c-cluster-legacy-pages-page',
          params: {
            page:    'notifiers',
            cluster: 'c-m-f6ltlnw5',
            product: 'legacy'
          }
        },
        name:     'v1-notifiers',
        weight:   111,
        overview: false
      },
      {
        label:        'Project',
        labelDisplay: 'Project',
        mode:         'basic',
        count:        '__vue_devtool_undefined__',
        exact:        true,
        namespaced:   true,
        route:        {
          name:   'c-cluster-legacy-project',
          params: {
            cluster: 'c-m-f6ltlnw5',
            product: 'legacy'
          }
        },
        name:     'v1-project-overview',
        weight:   105,
        overview: false
      }
    ],
    weight: 80
  },
  {
    name:        'inUse',
    label:       'More Resources',
    weight:      0,
    defaultType: '__vue_devtool_undefined__',
    children:    [
      {
        name:        'admission',
        label:       'Admission',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'MutatingWebhookConfigurations',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>MutatingWebhookConfigurations',
            mode:         'used',
            count:        1,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'admissionregistration.k8s.io.mutatingwebhookconfiguration'
              }
            },
            name:     'admissionregistration.k8s.io.mutatingwebhookconfiguration',
            weight:   0,
            overview: false
          },
          {
            label:        'ValidatingWebhookConfigurations',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>ValidatingWebhookConfigurations',
            mode:         'used',
            count:        2,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'admissionregistration.k8s.io.validatingwebhookconfiguration'
              }
            },
            name:     'admissionregistration.k8s.io.validatingwebhookconfiguration',
            weight:   0,
            overview: false
          }
        ]
      },
      {
        name:        'API',
        label:       'API',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'APIServices',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>APIServices',
            mode:         'used',
            count:        40,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'apiregistration.k8s.io.apiservice'
              }
            },
            name:     'apiregistration.k8s.io.apiservice',
            weight:   0,
            overview: false
          },
          {
            label:        'CustomResourceDefinitions',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>CustomResourceDefinitions',
            mode:         'used',
            count:        51,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'apiextensions.k8s.io.customresourcedefinition'
              }
            },
            name:     'apiextensions.k8s.io.customresourcedefinition',
            weight:   0,
            overview: false
          },
          {
            label:        'FlowSchemas',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>FlowSchemas',
            mode:         'used',
            count:        12,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'flowcontrol.apiserver.k8s.io.flowschema'
              }
            },
            name:     'flowcontrol.apiserver.k8s.io.flowschema',
            weight:   0,
            overview: false
          },
          {
            label:        'PriorityLevelConfigurations',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>PriorityLevelConfigurations',
            mode:         'used',
            count:        8,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'flowcontrol.apiserver.k8s.io.prioritylevelconfiguration'
              }
            },
            name:     'flowcontrol.apiserver.k8s.io.prioritylevelconfiguration',
            weight:   0,
            overview: false
          }
        ]
      },
      {
        name:        'apps',
        label:       'Apps',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'ControllerRevisions',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>ControllerRevisions',
            mode:         'used',
            count:        2,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'apps.controllerrevision'
              }
            },
            name:     'apps.controllerrevision',
            weight:   0,
            overview: false
          },
          {
            label:        'Deployments',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>Deployments',
            mode:         'used',
            count:        3,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'apps.deployment'
              }
            },
            name:     'apps.deployment',
            weight:   0,
            overview: false
          },
          {
            label:        'ReplicaSets',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>ReplicaSets',
            mode:         'used',
            count:        3,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'apps.replicaset'
              }
            },
            name:     'apps.replicaset',
            weight:   0,
            overview: false
          },
          {
            label:        'StatefulSets',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>StatefulSets',
            mode:         'used',
            count:        2,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'apps.statefulset'
              }
            },
            name:     'apps.statefulset',
            weight:   0,
            overview: false
          }
        ]
      },
      {
        name:        'Calico',
        label:       'Calico',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'BlockAffinities',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>BlockAffinities',
            mode:         'used',
            count:        4,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'crd.projectcalico.org.blockaffinity'
              }
            },
            name:     'crd.projectcalico.org.blockaffinity',
            weight:   0,
            overview: false
          },
          {
            label:        'ClusterInformations',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>ClusterInformations',
            mode:         'used',
            count:        1,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'crd.projectcalico.org.clusterinformation'
              }
            },
            name:     'crd.projectcalico.org.clusterinformation',
            weight:   0,
            overview: false
          },
          {
            label:        'FelixConfigurations',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>FelixConfigurations',
            mode:         'used',
            count:        1,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'crd.projectcalico.org.felixconfiguration'
              }
            },
            name:     'crd.projectcalico.org.felixconfiguration',
            weight:   0,
            overview: false
          },
          {
            label:        'IPAMBlocks',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>IPAMBlocks',
            mode:         'used',
            count:        4,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'crd.projectcalico.org.ipamblock'
              }
            },
            name:     'crd.projectcalico.org.ipamblock',
            weight:   0,
            overview: false
          },
          {
            label:        'IPAMConfigs',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>IPAMConfigs',
            mode:         'used',
            count:        1,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'crd.projectcalico.org.ipamconfig'
              }
            },
            name:     'crd.projectcalico.org.ipamconfig',
            weight:   0,
            overview: false
          },
          {
            label:        'IPAMHandles',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>IPAMHandles',
            mode:         'used',
            count:        30,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'crd.projectcalico.org.ipamhandle'
              }
            },
            name:     'crd.projectcalico.org.ipamhandle',
            weight:   0,
            overview: false
          },
          {
            label:        'IPPools',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>IPPools',
            mode:         'used',
            count:        1,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'crd.projectcalico.org.ippool'
              }
            },
            name:     'crd.projectcalico.org.ippool',
            weight:   0,
            overview: false
          },
          {
            label:        'KubeControllersConfigurations',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>KubeControllersConfigurations',
            mode:         'used',
            count:        1,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'crd.projectcalico.org.kubecontrollersconfiguration'
              }
            },
            name:     'crd.projectcalico.org.kubecontrollersconfiguration',
            weight:   0,
            overview: false
          }
        ]
      },
      {
        name:        'core',
        label:       'Core',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'Nodes',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>Nodes',
            mode:         'used',
            count:        4,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'node'
              }
            },
            name:     'node',
            weight:   0,
            overview: false
          },
          {
            label:        'ConfigMaps',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>ConfigMaps',
            mode:         'used',
            count:        30,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'configmap'
              }
            },
            name:     'configmap',
            weight:   0,
            overview: false
          },
          {
            label:        'Endpoints',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>Endpoints',
            mode:         'used',
            count:        8,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'endpoints'
              }
            },
            name:     'endpoints',
            weight:   0,
            overview: false
          },
          {
            label:        'Events',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>Events',
            mode:         'used',
            count:        180,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'event'
              }
            },
            name:     'event',
            weight:   0,
            overview: false
          },
          {
            label:        'Pods',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>Pods',
            mode:         'used',
            count:        5,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'pod'
              }
            },
            name:     'pod',
            weight:   0,
            overview: false
          },
          {
            label:        'Secrets',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>Secrets',
            mode:         'used',
            count:        29,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'secret'
              }
            },
            name:     'secret',
            weight:   0,
            overview: false
          },
          {
            label:        'ServiceAccounts',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>ServiceAccounts',
            mode:         'used',
            count:        9,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'serviceaccount'
              }
            },
            name:     'serviceaccount',
            weight:   0,
            overview: false
          },
          {
            label:        'Services',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>Services',
            mode:         'used',
            count:        8,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'service'
              }
            },
            name:     'service',
            weight:   0,
            overview: false
          }
        ]
      },
      {
        name:        'Discovery',
        label:       'Discovery',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'EndpointSlices',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>EndpointSlices',
            mode:         'used',
            count:        8,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'discovery.k8s.io.endpointslice'
              }
            },
            name:     'discovery.k8s.io.endpointslice',
            weight:   0,
            overview: false
          }
        ]
      },
      {
        name:        'K3s',
        label:       'K3s',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'Project Monitors',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>Project Monitors',
            mode:         'used',
            count:        1,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'helm.cattle.io.projecthelmchart'
              }
            },
            name:     'helm.cattle.io.projecthelmchart',
            weight:   0,
            overview: false
          }
        ]
      },
      {
        name:        'Monitoring',
        label:       'Monitoring',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'AlertmanagerConfigs',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>AlertmanagerConfigs',
            mode:         'used',
            count:        3,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'monitoring.coreos.com.alertmanagerconfig'
              }
            },
            name:     'monitoring.coreos.com.alertmanagerconfig',
            weight:   0,
            overview: false
          },
          {
            label:        'Alertmanagers',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>Alertmanagers',
            mode:         'used',
            count:        1,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'monitoring.coreos.com.alertmanager'
              }
            },
            name:     'monitoring.coreos.com.alertmanager',
            weight:   0,
            overview: false
          },
          {
            label:        'Prometheis',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>Prometheis',
            mode:         'used',
            count:        1,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'monitoring.coreos.com.prometheus'
              }
            },
            name:     'monitoring.coreos.com.prometheus',
            weight:   0,
            overview: false
          },
          {
            label:        'PrometheusRules',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>PrometheusRules',
            mode:         'used',
            count:        5,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'monitoring.coreos.com.prometheusrule'
              }
            },
            name:     'monitoring.coreos.com.prometheusrule',
            weight:   0,
            overview: false
          },
          {
            label:        'Service Monitors',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>Service Monitors',
            mode:         'used',
            count:        4,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'monitoring.coreos.com.servicemonitor'
              }
            },
            name:     'monitoring.coreos.com.servicemonitor',
            weight:   0,
            overview: false
          }
        ]
      },
      {
        name:        'Networking',
        label:       'Networking',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'IngressClasses',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>IngressClasses',
            mode:         'used',
            count:        1,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'networking.k8s.io.ingressclass'
              }
            },
            name:     'networking.k8s.io.ingressclass',
            weight:   0,
            overview: false
          },
          {
            label:        'NetworkPolicies',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>NetworkPolicies',
            mode:         'used',
            count:        3,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'networking.k8s.io.networkpolicy'
              }
            },
            name:     'networking.k8s.io.networkpolicy',
            weight:   0,
            overview: false
          }
        ]
      },
      {
        name:        'Policy',
        label:       'Policy',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'PodSecurityPolicies',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>PodSecurityPolicies',
            mode:         'used',
            count:        35,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'policy.podsecuritypolicy'
              }
            },
            name:     'policy.podsecuritypolicy',
            weight:   0,
            overview: false
          }
        ]
      },
      {
        name:        'Rancher',
        label:       'Rancher',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'Authentication Providers',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>Authentication Providers',
            mode:         'used',
            count:        14,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'management.cattle.io.authconfig'
              }
            },
            name:     'management.cattle.io.authconfig',
            weight:   0,
            overview: false
          },
          {
            label:        'Mgmt Clusters',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>Mgmt Clusters',
            mode:         'used',
            count:        1,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'management.cattle.io.cluster'
              }
            },
            name:     'management.cattle.io.cluster',
            weight:   0,
            overview: false
          },
          {
            label:        'Repositories',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>Repositories',
            mode:         'used',
            count:        3,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'catalog.cattle.io.clusterrepo'
              }
            },
            name:     'catalog.cattle.io.clusterrepo',
            weight:   0,
            overview: false
          },
          {
            label:        'Installed Apps',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>Installed Apps',
            mode:         'used',
            count:        2,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'catalog.cattle.io.app'
              }
            },
            name:     'catalog.cattle.io.app',
            weight:   0,
            overview: false
          }
        ]
      },
      {
        name:        'RBAC',
        label:       'RBAC',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'ClusterRoleBindings',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>ClusterRoleBindings',
            mode:         'used',
            count:        115,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'rbac.authorization.k8s.io.clusterrolebinding'
              }
            },
            name:     'rbac.authorization.k8s.io.clusterrolebinding',
            weight:   0,
            overview: false
          },
          {
            label:        'ClusterRoles',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>ClusterRoles',
            mode:         'used',
            count:        132,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'rbac.authorization.k8s.io.clusterrole'
              }
            },
            name:     'rbac.authorization.k8s.io.clusterrole',
            weight:   0,
            overview: false
          },
          {
            label:        'RoleBindings',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>RoleBindings',
            mode:         'used',
            count:        9,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'rbac.authorization.k8s.io.rolebinding'
              }
            },
            name:     'rbac.authorization.k8s.io.rolebinding',
            weight:   0,
            overview: false
          },
          {
            label:        'Roles',
            labelDisplay: '<i class="icon icon-fw icon-folder"></i>Roles',
            mode:         'used',
            count:        7,
            exact:        false,
            namespaced:   true,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'rbac.authorization.k8s.io.role'
              }
            },
            name:     'rbac.authorization.k8s.io.role',
            weight:   0,
            overview: false
          }
        ]
      },
      {
        name:        'Scheduling',
        label:       'Scheduling',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'PriorityClasses',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>PriorityClasses',
            mode:         'used',
            count:        2,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'scheduling.k8s.io.priorityclass'
              }
            },
            name:     'scheduling.k8s.io.priorityclass',
            weight:   0,
            overview: false
          }
        ]
      },
      {
        name:        'Storage',
        label:       'Storage',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'CSINodes',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>CSINodes',
            mode:         'used',
            count:        4,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'storage.k8s.io.csinode'
              }
            },
            name:     'storage.k8s.io.csinode',
            weight:   0,
            overview: false
          }
        ]
      },
      {
        name:        'Tigera',
        label:       'Tigera',
        weight:      0,
        defaultType: '__vue_devtool_undefined__',
        children:    [
          {
            label:        'Installations',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>Installations',
            mode:         'used',
            count:        1,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'operator.tigera.io.installation'
              }
            },
            name:     'operator.tigera.io.installation',
            weight:   0,
            overview: false
          },
          {
            label:        'TigeraStatuses',
            labelDisplay: '<i class="icon icon-fw icon-globe"></i>TigeraStatuses',
            mode:         'used',
            count:        1,
            exact:        false,
            namespaced:   false,
            route:        {
              name:   'c-cluster-product-resource',
              params: {
                product:  'explorer',
                cluster:  'c-m-f6ltlnw5',
                resource: 'operator.tigera.io.tigerastatus'
              }
            },
            name:     'operator.tigera.io.tigerastatus',
            weight:   0,
            overview: false
          }
        ]
      }
    ]
  }
];

export default sideNavData;
