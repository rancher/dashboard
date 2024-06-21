export const providersList = [
  {
    clusterProviderQueryParam: 'amazoneks',
    label:                     'Amazon EKS',
    conditions:                [
      {
        rkeType: 'rke2',
        loads:   'rke2'
      },
      {
        rkeType: 'rke1',
        loads:   'rke2'
      },
    ]
  },
  {
    clusterProviderQueryParam: 'azureaks',
    label:                     'Azure AKS',
    conditions:                [
      {
        rkeType: 'rke2',
        loads:   'rke2'
      },
      {
        rkeType: 'rke1',
        loads:   'rke2'
      },
    ]
  },
  {
    clusterProviderQueryParam: 'googlegke',
    label:                     'Google GKE',
    conditions:                [
      {
        rkeType: 'rke2',
        loads:   'rke2'
      },
      {
        rkeType: 'rke1',
        loads:   'rke2'
      },
    ]
  },
  {
    clusterProviderQueryParam: 'amazonec2',
    label:                     'Amazon EC2',
    conditions:                [
      {
        rkeType: 'rke2',
        loads:   'rke2'
      },
      {
        rkeType: 'rke1',
        loads:   'rke1'
      },
    ]
  },
  {
    clusterProviderQueryParam: 'azure',
    label:                     'Azure',
    conditions:                [
      {
        rkeType: 'rke2',
        loads:   'rke2'
      },
      {
        rkeType: 'rke1',
        loads:   'rke1'
      },
    ]
  },
  {
    clusterProviderQueryParam: 'digitalocean',
    label:                     'DigitalOcean',
    conditions:                [
      {
        rkeType: 'rke2',
        loads:   'rke2'
      },
      {
        rkeType: 'rke1',
        loads:   'rke1'
      },
    ]
  },
  {
    clusterProviderQueryParam: 'azureaks',
    label:                     'Azure AKS',
    conditions:                [
      {
        rkeType: 'rke2',
        loads:   'rke2'
      },
      {
        rkeType: 'rke1',
        loads:   'rke2'
      },
    ]
  },
  {
    clusterProviderQueryParam: 'harvester',
    label:                     'Harvester',
    conditions:                [
      {
        rkeType: 'rke2',
        loads:   'rke2'
      },
      {
        rkeType: 'rke1',
        loads:   'rke1'
      },
    ]
  },
  {
    clusterProviderQueryParam: 'linode',
    label:                     'Linode',
    conditions:                [
      {
        rkeType: 'rke2',
        loads:   'rke2'
      },
      {
        rkeType: 'rke1',
        loads:   'rke1'
      },
    ]
  },
  {
    clusterProviderQueryParam: 'azure',
    label:                     'Azure',
    conditions:                [
      {
        rkeType: 'rke2',
        loads:   'rke2'
      },
      {
        rkeType: 'rke1',
        loads:   'rke1'
      },
    ]
  },
  {
    clusterProviderQueryParam: 'vmwarevsphere',
    label:                     'VMware vSphere',
    conditions:                [
      {
        rkeType: 'rke2',
        loads:   'rke2',
        label:   'VMware vSphere',
      },
      {
        rkeType: 'rke1',
        loads:   'rke1',
        label:   'vSphere',
      },
    ]
  },
  {
    clusterProviderQueryParam: 'custom',
    label:                     'Custom',
    conditions:                [
      {
        rkeType: 'rke2',
        loads:   'rke2'
      },
      {
        rkeType: 'rke1',
        loads:   'rke1'
      },
    ]
  },
];
