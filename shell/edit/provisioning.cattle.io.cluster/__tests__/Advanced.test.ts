/* eslint-disable jest/no-hooks */
import { mount, Wrapper } from '@vue/test-utils';
import Advanced from '@shell/edit/provisioning.cattle.io.cluster/tabs/Advanced.vue';
import { _YAML, _VIEW } from '@shell/config/query-params';
import { clone } from '@shell/utils/object';

const PROV_CLUSTER = {
  id:         'fleet-default/test-args',
  type:       'provisioning.cattle.io.cluster',
  apiVersion: 'provisioning.cattle.io/v1',
  kind:       'Cluster',
  metadata:   {
    annotations:       { 'field.cattle.io/creatorId': 'user' },
    creationTimestamp: '2024-01-14T10:03:39Z',
    generation:        3,
    name:              'test-args',
    namespace:         'fleet-default',
    state:             {
      error:         false,
      message:       'Resource is Ready',
      name:          'active',
      transitioning: false
    },
    uid:    'eab4ed52-c339-4d61-8dc2-804d09f36425',
    labels: {}
  },
  spec: {
    kubernetesVersion:        'v1.27.8+rke2r1',
    localClusterAuthEndpoint: {
      enabled: false,
      caCerts: '',
      fqdn:    ''
    },
    rkeConfig: {
      chartValues: { 'rke2-calico': {} },
      etcd:        {
        snapshotRetention:    5,
        snapshotScheduleCron: '0 */5 * * *',
        disableSnapshots:     false
      },
      machineGlobalConfig: {
        cni:                   'calico',
        'disable-kube-proxy':  false,
        'etcd-expose-metrics': false
      },
      machinePoolDefaults: {},
      machinePools:        [
        {
          controlPlaneRole:  true,
          drainBeforeDelete: true,
          etcdRole:          true,
          machineConfigRef:  {
            kind: 'DigitaloceanConfig',
            name: 'nc-test-args-pool1-dfvbh'
          },
          name:                 'pool1',
          quantity:             1,
          unhealthyNodeTimeout: '0s',
          workerRole:           true
        }
      ],
      machineSelectorConfig: [
        { config: { 'protect-kernel-defaults': false } }
      ],
      registries: {
        configs: {},
        mirrors: {}
      },
    },
    defaultPodSecurityAdmissionConfigurationTemplateName: '',
  },
  status: {
    agentDeployed:      true,
    clientSecretName:   'test-args-kubeconfig',
    clusterName:        'c-m-qk7hvstl',
    fleetWorkspaceName: 'fleet-default',
    observedGeneration: 3,
    ready:              true
  }
};

const VERSION = {
  label:      'v1.27.8+rke2r1',
  value:      'v1.27.8+rke2r1',
  sort:       '0000000001.0000000027.0000000008.rke0000000002r0000000001',
  serverArgs: {
    'audit-policy-file': {
      type:   'string',
      create: false,
      update: false
    },
    'cluster-cidr': {
      type:   'string',
      create: false,
      update: false
    },
    'cluster-dns': {
      type:   'string',
      create: false,
      update: false
    },
    'cluster-domain': {
      type:   'string',
      create: false,
      update: false
    },
    cni: {
      type:    'array',
      default: 'calico',
      create:  false,
      update:  false,
      options: [
        'canal',
        'cilium',
        'calico',
        'multus,canal',
        'multus,cilium',
        'multus,calico'
      ]
    },
    'container-runtime-endpoint': {
      type:   'string',
      create: false,
      update: false
    },
    disable: {
      type:    'array',
      create:  false,
      update:  false,
      options: [
        'rke2-coredns',
        'rke2-ingress-nginx',
        'rke2-metrics-server'
      ]
    },
    'disable-cloud-controller': {
      type:   'bool',
      create: false,
      update: false
    },
    'disable-kube-proxy': {
      type:    'boolean',
      default: false,
      create:  false,
      update:  false
    },
    'disable-scheduler': {
      type:   'bool',
      create: false,
      update: false
    },
    'egress-selector-mode': {
      type:   'string',
      create: false,
      update: false
    },
    'etcd-arg': {
      type:   'array',
      create: false,
      update: false
    },
    'etcd-expose-metrics': {
      type:    'boolean',
      default: false,
      create:  false,
      update:  false
    },
    'etcd-image': {
      type:   'string',
      create: false,
      update: false
    },
    'kube-apiserver-arg': {
      type:   'array',
      create: false,
      update: false
    },
    'kube-apiserver-image': {
      type:   'string',
      create: false,
      update: false
    },
    'kube-cloud-controller-manager-arg': {
      type:   'array',
      create: false,
      update: false
    },
    'kube-controller-manager-arg': {
      type:   'array',
      create: false,
      update: false
    },
    'kube-controller-manager-image': {
      type:   'string',
      create: false,
      update: false
    },
    'kube-proxy-arg': {
      type:   'array',
      create: false,
      update: false
    },
    'kube-scheduler-arg': {
      type:   'array',
      create: false,
      update: false
    },
    'kube-scheduler-image': {
      type:   'string',
      create: false,
      update: false
    },
    'kubelet-path': {
      type:   'string',
      create: false,
      update: false
    },
    'pause-image': {
      type:   'string',
      create: false,
      update: false
    },
    'runtime-image': {
      type:   'string',
      create: false,
      update: false
    },
    'service-cidr': {
      type:   'string',
      create: false,
      update: false
    },
    'service-node-port-range': {
      type:   'string',
      create: false,
      update: false
    },
    snapshotter: {
      type:   'string',
      create: false,
      update: false
    },
    'tls-san': {
      type:   'array',
      create: false,
      update: false
    },
    'tls-san-security': {
      type:   'boolean',
      create: false,
      update: false
    }
  },
  agentArgs: {
    'audit-policy-file': {
      type:   'string',
      create: false,
      update: false
    },
    'cloud-controller-manager-extra-env': {
      type:   'array',
      create: false,
      update: false
    },
    'cloud-controller-manager-extra-mount': {
      type:   'array',
      create: false,
      update: false
    },
    'cloud-provider-config': {
      type:   'string',
      create: false,
      update: false
    },
    'cloud-provider-name': {
      type:     'enum',
      nullable: true,
      create:   false,
      update:   false,
      options:  [
        'aws',
        'azure',
        'gcp',
        'rancher-vsphere',
        'harvester',
        'external'
      ]
    },
    'control-plane-resource-limits': {
      type:   'string',
      create: false,
      update: false
    },
    'control-plane-resource-requests': {
      type:   'string',
      create: false,
      update: false
    },
    'etcd-extra-env': {
      type:   'array',
      create: false,
      update: false
    },
    'etcd-extra-mount': {
      type:   'array',
      create: false,
      update: false
    },
    'kube-apiserver-extra-env': {
      type:   'array',
      create: false,
      update: false
    },
    'kube-apiserver-extra-mount': {
      type:   'array',
      create: false,
      update: false
    },
    'kube-controller-manager-extra-env': {
      type:   'array',
      create: false,
      update: false
    },
    'kube-controller-manager-extra-mount': {
      type:   'array',
      create: false,
      update: false
    },
    'kube-proxy-arg': {
      type:   'array',
      create: false,
      update: false
    },
    'kube-proxy-extra-env': {
      type:   'array',
      create: false,
      update: false
    },
    'kube-proxy-extra-mount': {
      type:   'array',
      create: false,
      update: false
    },
    'kube-scheduler-extra-env': {
      type:   'array',
      create: false,
      update: false
    },
    'kube-scheduler-extra-mount': {
      type:   'array',
      create: false,
      update: false
    },
    'kubelet-arg': {
      type:   'array',
      create: false,
      update: false
    },
    profile: {
      type:     'enum',
      nullable: true,
      create:   false,
      update:   false,
      options:  [
        'cis',
        'cis-1.23'
      ]
    },
    'protect-kernel-defaults': {
      type:    'boolean',
      default: false,
      create:  false,
      update:  false
    },
    'resolv-conf': {
      type:   'string',
      create: false,
      update: false
    },
    selinux: {
      type:   'bool',
      create: false,
      update: false
    },
    'system-default-registry': {
      type:   'string',
      create: false,
      update: false
    }
  },
  disabled: false
};

describe('component: Advanced', () => {
  let wrapper: Wrapper<InstanceType<typeof Advanced>>;

  const mountOptions = {
    propsData: {
      value:           {},
      mode:            _VIEW,
      haveArgInfo:     true,
      selectedVersion: VERSION
    },
    mocks: {
      $store: {
        getters: {
          currentStore:              () => 'current_store',
          'current_store/schemaFor': jest.fn(),
          'current_store/all':       jest.fn(),
          'i18n/t':                  jest.fn(),
          'i18n/exists':             jest.fn(),
        }
      },
      $route:  { query: { AS: _YAML } },
      $router: { applyQuery: jest.fn() },
    }
  };

  describe('cluster configurations', () => {
    it(`should supports empty machineSelectorConfig`, () => {
      const value = clone(PROV_CLUSTER);

      value.spec.rkeConfig.machineSelectorConfig = [];

      mountOptions.propsData.value = value;

      wrapper = mount(
        Advanced,
        mountOptions
      );

      const inputElem = wrapper.find('[data-testid="array-list-box0"]').element as HTMLElement;

      expect(inputElem).toBeUndefined();
    });

    describe(`'protect-kernel-defaults'`, () => {
      it(`should show value from machineGlobalConfig`, () => {
        const value = clone(PROV_CLUSTER);

        value.spec.rkeConfig.machineGlobalConfig['protect-kernel-defaults'] = true;
        value.spec.rkeConfig.machineSelectorConfig = [{
          config:               {},
          machineLabelSelector: {
            matchExpressions: [{
              key:      'foo',
              operator: 'In',
              values:   ['bar'],
            }],
            matchLabels: { foo1: 'bar1' },
          }
        }];

        mountOptions.propsData.mode = _VIEW;
        mountOptions.propsData.value = value;

        wrapper = mount(
          Advanced,
          mountOptions
        );

        const checkbox = wrapper.find('[data-testid="protect-kernel-defaults"]').find('[type="checkbox"]').element as HTMLInputElement;

        expect(checkbox.value).toBe('true');
      });

      it(`should show value from machineSelectorConfig.config`, () => {
        const value = clone(PROV_CLUSTER);

        value.spec.rkeConfig.machineGlobalConfig['protect-kernel-defaults'] = false;
        value.spec.rkeConfig.machineSelectorConfig = [{
          config:               {},
          machineLabelSelector: {
            config:           { 'protect-kernel-defaults': true },
            matchExpressions: [{
              key:      'foo',
              operator: 'In',
              values:   ['bar'],
            }],
            matchLabels: { foo1: 'bar1' },
          }
        }];

        mountOptions.propsData.mode = _VIEW;
        mountOptions.propsData.value = value;

        wrapper = mount(
          Advanced,
          mountOptions
        );

        const checkbox = wrapper.find('[data-testid="protect-kernel-defaults"]').find('[type="checkbox"]').element as HTMLInputElement;

        expect(checkbox.value).toBe('true');
      });
    });
  });
});
