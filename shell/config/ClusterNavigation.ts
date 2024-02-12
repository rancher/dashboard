export interface Item {
    name: string;
    label?: string;
    labelKey?: string;
    children: Item[];
}

const navigation: Item[] = [
  {
    name:     'Starred',
    labelKey: 'nav.group.starred',
    children: [
      {
        name:     'starred-PolicyServers',
        label:    'PolicyServers',
        children: []
      },
      {
        name:     'starred-ConfigMaps',
        label:    'ConfigMaps',
        children: []
      },
      {
        name:     'starred-Secrets',
        label:    'Secrets',
        children: []
      }
    ]
  },
  {
    name:     'Cluster',
    labelKey: 'nav.group.cluster',
    children: [
      {
        name:     'projectNamespaces',
        labelKey: 'projectNamespaces.label',
        children: []
      },
      {
        name:     'nodes',
        labelKey: 'typeLabel.node',
        children: []
      },
      {
        name:     'clusterAndProjectMembers',
        labelKey: 'members.clusterAndProject',
        children: []
      },
      {
        name:     'events',
        labelKey: 'typeLabel.event',
        children: []
      }
    ]
  },
  {
    name:     'Workloads',
    labelKey: 'nav.group.workload',
    children: [
      {
        name:     'cronjobs',
        labelKey: 'typeLabel.cronjob',
        children: []
      },
      {
        name:     'daemonsets',
        labelKey: 'typeLabel.daemonSet',
        children: []
      },
      {
        name:     'deployments',
        labelKey: 'typeLabel.deployment',
        children: []
      },
      {
        name:     'jobs',
        labelKey: 'typeLabel.job',
        children: []
      },
      {
        name:     'statefulsets',
        labelKey: 'typeLabel.statefulSet',
        children: []
      },
      {
        name:     'pods',
        labelKey: 'typeLabel.pod',
        children: []
      }
    ]
  },
  {
    name:     'Apps',
    labelKey: 'nav.group.apps',
    children: [
      {
        name:     'cronjobs',
        labelKey: 'typeLabel.cronjob',
        children: []
      },
      {
        name:     'daemonsets',
        labelKey: 'typeLabel.daemonSet',
        children: []
      },
      {
        name:     'deployments',
        labelKey: 'typeLabel.deployment',
        children: []
      },
      {
        name:     'jobs',
        labelKey: 'typeLabel.job',
        children: []
      },
    ]
  },
  {
    name:     'Service Discovery',
    labelKey: 'nav.group.serviceDiscovery',
    children: [
      {
        name:     'cronjobs',
        labelKey: 'typeLabel.cronjob',
        children: []
      },
      {
        name:     'daemonsets',
        labelKey: 'typeLabel.daemonSet',
        children: []
      },
      {
        name:     'deployments',
        labelKey: 'typeLabel.deployment',
        children: []
      },
    ]
  },
  {
    name:     'Storage',
    labelKey: 'nav.group.storage',
    children: [
      {
        name:     'cronjobs',
        labelKey: 'typeLabel.cronjob',
        children: []
      },
      {
        name:     'daemonsets',
        labelKey: 'typeLabel.daemonSet',
        children: []
      },
      {
        name:     'deployments',
        labelKey: 'typeLabel.deployment',
        children: []
      },
      {
        name:     'jobs',
        labelKey: 'typeLabel.job',
        children: []
      },
      {
        name:     'cronjobs',
        labelKey: 'typeLabel.cronjob',
        children: []
      },
      {
        name:     'daemonsets',
        labelKey: 'typeLabel.daemonSet',
        children: []
      }
    ]
  },
  {
    name:     'Policy',
    labelKey: 'nav.group.Policy',
    children: [
      {
        name:     'cronjobs',
        labelKey: 'typeLabel.cronjob',
        children: []
      },
      {
        name:     'daemonsets',
        labelKey: 'typeLabel.daemonSet',
        children: []
      },
      {
        name:     'deployments',
        labelKey: 'typeLabel.deployment',
        children: []
      },
      {
        name:     'jobs',
        labelKey: 'typeLabel.job',
        children: []
      },
    ]
  },
  {
    name:     'More Resources',
    labelKey: 'nav.group.workload',
    children: []
  }
];

export function loadNavigation(): Item[] {
  return navigation;
}
