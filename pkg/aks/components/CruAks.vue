<script lang='ts'>
import semver from 'semver';
import { mapGetters, Store } from 'vuex';
import { defineComponent } from 'vue';

import { randomStr } from '@shell/utils/string';
import { isArray, removeObject } from '@shell/utils/array';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { NORMAN, MANAGEMENT } from '@shell/config/types';
import { sortable } from '@shell/utils/version';
import { sortBy } from '@shell/utils/sort';
import { SETTING } from '@shell/config/settings';
import { parseAzureError } from '@shell/utils/azure';

import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';
import CruResource from '@shell/components/CruResource.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import FileSelector from '@shell/components/form/FileSelector.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import Labels from '@shell/components/form/Labels.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Accordion from '@components/Accordion/Accordion.vue';
import Banner from '@components/Banner/Banner.vue';
import Loading from '@shell/components/Loading.vue';

import ClusterMembershipEditor, { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor.vue';
import AksNodePool from '@pkg/aks/components/AksNodePool.vue';
import type { AKSDiskType, AKSNodePool, AKSPoolMode, AKSConfig } from '../types/index';
import {
  getAKSRegions, getAKSVirtualNetworks, getAKSVMSizes, getAKSKubernetesVersions
  , regionsWithAvailabilityZones
} from '../util/aks';
import { parseTaint } from '../util/taints';

import { diffUpstreamSpec, syncUpstreamConfig } from '@shell/utils/kontainer';
import {
  requiredInCluster,
  clusterNameChars,
  clusterNameStartEnd,
  clusterNameLength,
  resourceGroupChars,
  resourceGroupEnd,
  resourceGroupLength,
  ipv4WithOrWithoutCidr,
  ipv4WithCidr,
  outboundTypeUserDefined,
  privateDnsZone,
  nodePoolNames,
  nodePoolNamesUnique,
  nodePoolCount
} from '../util/validators';
import { CREATOR_PRINCIPAL_ID } from '@shell/config/labels-annotations';

export const defaultNodePool = {
  availabilityZones:     ['1', '2', '3'],
  count:                 1,
  enableAutoScaling:     false,
  maxPods:               110,
  maxSurge:              '1',
  mode:                  'System' as AKSPoolMode,
  name:                  'agentpool',
  nodeLabels:            { },
  nodeTaints:            [],
  orchestratorVersion:   '',
  osDiskSizeGB:          128,
  osDiskType:            'Managed' as AKSDiskType,
  osType:                'Linux',
  vmSize:                'Standard_DS2_v2',
  _isNewOrUnprovisioned: true,
  _validation:           {}
};

const defaultAksConfig = {
  clusterName:        '',
  imported:           false,
  linuxAdminUsername: 'azureuser',
  loadBalancerSku:    'Standard',
  networkPlugin:      'kubenet',
  privateCluster:     false,
  tags:               {},
  outboundType:       'LoadBalancer',
  serviceCidr:        '10.0.0.0/16',
  dockerBridgeCidr:   '172.17.0.1/16',
  dnsServiceIp:       '10.0.0.10',
};

const defaultCluster = {
  dockerRootDir:           '/var/lib/docker',
  enableClusterAlerting:   false,
  enableClusterMonitoring: false,
  enableNetworkPolicy:     false,
  labels:                  {},
  annotations:             {},
  windowsPreferedCluster:  false,
};

const DEFAULT_REGION = 'eastus';

const _NONE = 'none';

export default defineComponent({
  name: 'CruAKS',

  emits: ['validationChanged'],

  components: {
    SelectCredential,
    CruResource,
    LabeledSelect,
    AksNodePool,
    LabeledInput,
    Checkbox,
    FileSelector,
    KeyValue,
    ArrayList,
    ClusterMembershipEditor,
    Labels,
    Tabbed,
    Tab,
    Accordion,
    Banner,
    Loading
  },

  mixins: [CreateEditView, FormValidation],

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    // provisioning cluster object
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  // AKS provisioning needs to use the norman API - a provisioning cluster resource will be created by the BE when the norman cluster is made but v2 prov clusters don't contain the relevant aks configuration fields
  async fetch() {
    const store = this.$store as Store<any>;

    if (this.value.id) {
      const liveNormanCluster = await this.value.findNormanCluster();

      this.normanCluster = await store.dispatch(`rancher/clone`, { resource: liveNormanCluster });

      // ensure any fields editable through this UI that have been altered in azure portal are shown here - see syncUpstreamConfig jsdoc for details
      if (!this.isNewOrUnprovisioned) {
        syncUpstreamConfig('aks', this.normanCluster);
      }

      // track original version on edit to ensure we don't offer k8s downgrades
      this.originalVersion = this.normanCluster?.aksConfig?.kubernetesVersion;
    } else {
      this.normanCluster = await store.dispatch('rancher/create', { type: NORMAN.CLUSTER, ...defaultCluster }, { root: true });

      if (!this.$store.getters['auth/principalId'].includes('local://')) {
        this.normanCluster.annotations[CREATOR_PRINCIPAL_ID] = this.$store.getters['auth/principalId'];
      }
    }
    if (!this.normanCluster.aksConfig) {
      this.normanCluster['aksConfig'] = { ...defaultAksConfig };
    }
    if (!this.normanCluster.aksConfig.nodePools) {
      this.normanCluster.aksConfig['nodePools'] = [{ ...defaultNodePool }];
    }
    this.config = this.normanCluster.aksConfig;
    this.nodePools = this.normanCluster.aksConfig.nodePools;
    this.setAuthorizedIPRanges = !!(this.config?.authorizedIpRanges || []).length;
    this.nodePools.forEach((pool: AKSNodePool) => {
      pool['_id'] = randomStr();
      pool['_isNewOrUnprovisioned'] = this.isNewOrUnprovisioned;
      pool['_validation'] = {};
    });
  },

  data() {
    const store = this.$store as Store<any>;
    // This setting is used by RKE1 AKS GKE and EKS - rke2/k3s have a different mechanism for fetching supported versions
    const supportedVersionRange = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_SUPPORTED_K8S_VERSIONS)?.value;
    const t = store.getters['i18n/t'];

    return {
      normanCluster:    { name: '' } as any,
      nodePools:        [] as AKSNodePool[],
      config:           { } as AKSConfig,
      membershipUpdate: {} as any,
      originalVersion:  '',

      supportedVersionRange,
      locationOptions:    [] as string[],
      allAksVersions:     [] as string[],
      vmSizeOptions:      [] as string[],
      vmSizeInfo:         {} as any,
      allVirtualNetworks: [] as any[],
      defaultVmSize:      defaultNodePool.vmSize as string,

      // if the user changes these then switches to a region without them, show a fv error
      // if they change region without having touched these, just update the (default) value
      touchedVersion:        false,
      touchedVmSize:         false,
      touchedVirtualNetwork: false,

      networkPluginOptions: [
        { value: 'kubenet', label: t('aks.networkPlugin.options.kubenet') }, { value: 'azure', label: t('aks.networkPlugin.options.azure') }
      ],

      loadingLocations:       false,
      loadingVersions:        false,
      loadingVmSizes:         false,
      loadingVirtualNetworks: false,
      setAuthorizedIPRanges:  false,
      fvFormRuleSets:         [{
        path:  'name',
        rules: ['nameRequired', 'clusterNameChars', 'clusterNameStartEnd', 'clusterNameLength'],
      },
      {
        path:  'resourceGroup',
        rules: ['resourceGroupRequired', 'resourceGroupLength', 'resourceGroupChars', 'resourceGroupEnd'],
      },
      {
        path:  'nodeResourceGroup',
        rules: ['nodeResourceGroupChars', 'nodeResourceGroupLength', 'nodeResourceGroupEnd'],
      },
      {
        path:  'dnsPrefix',
        rules: ['dnsPrefixRequired'],
      },
      {
        path:  'vmSize',
        rules: ['vmSizeAvailable']
      },
      {
        path:  'kubernetesVersion',
        rules: ['k8sVersionAvailable']
      },
      {
        path:  'networkPolicy',
        rules: ['networkPolicyAvailable']
      },
      {
        path:  'poolName',
        rules: ['poolNames']
      },
      {
        path:  'poolNamesUnique',
        rules: ['poolNamesUnique']
      },
      {
        path:  'poolAZ',
        rules: ['availabilityZoneSupport']
      },
      {
        path:  'poolCount',
        rules: ['poolCount']
      },
      {
        path:  'poolMin',
        rules: ['poolMin']
      },
      {
        path:  'poolMax',
        rules: ['poolMax']
      },
      {
        path:  'poolMinMax',
        rules: ['poolMinMax']
      },
      {
        path:  'poolTaints',
        rules: ['poolTaints']
      },
      {
        path:  'nodePoolsGeneral',
        rules: ['systemPoolRequired']
      },
      {
        path:  'authorizedIpRanges',
        rules: ['ipv4WithOrWithoutCidr']
      },
      {
        path:  'serviceCidr',
        rules: ['serviceCidr']
      },
      {
        path:  'podCidr',
        rules: ['podCidr']
      },
      {
        path:  'dockerBridgeCidr',
        rules: ['dockerBridgeCidr']
      },
      {
        path:  'outboundType',
        rules: ['outboundType']
      },
      {
        path:  'privateDnsZone',
        rules: ['privateDnsZone']
      },
      ],
    };
  },

  created() {
    const registerBeforeHook = this.registerBeforeHook as Function;
    const registerAfterHook = this.registerAfterHook as Function;

    registerBeforeHook(this.removeUnchangedConfigFields);
    registerAfterHook(this.saveRoleBindings, 'save-role-bindings');
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    /**
     * fv mixin accepts a rootObject in rules but doesn't seem to like that the norman cluster isn't yet defined when the rule set is defined so we're ignoring that and passing in the key we want validated here
     * entire context is passed in so validators can check if a credential is selected and only run when the rest of the form is shown + use the i18n/t getter + get the norman cluster
     *  */

    fvExtraRules() {
      return {
        nameRequired:            requiredInCluster(this, 'nameNsDescription.name.label', 'name'),
        locationRequired:        requiredInCluster(this, 'aks.location.label', 'aksConfig.location'),
        resourceGroupRequired:   requiredInCluster(this, 'aks.clusterResourceGroup.label', 'aksConfig.resourceGroup'),
        dnsPrefixRequired:       requiredInCluster(this, 'aks.dnsPrefix.label', 'aksConfig.dnsPrefix'),
        clusterNameChars:        clusterNameChars(this),
        clusterNameStartEnd:     clusterNameStartEnd(this),
        clusterNameLength:       clusterNameLength(this),
        resourceGroupChars:      resourceGroupChars(this, 'aks.clusterResourceGroup.label', 'aksConfig.resourceGroup'),
        nodeResourceGroupChars:  resourceGroupChars(this, 'aks.nodeResourceGroup.label', 'aksConfig.nodeResourceGroup'),
        resourceGroupLength:     resourceGroupLength(this, 'aks.clusterResourceGroup.label', 'aksConfig.resourceGroup'),
        nodeResourceGroupLength: resourceGroupLength(this, 'aks.nodeResourceGroup.label', 'aksConfig.nodeResourceGroup'),
        resourceGroupEnd:        resourceGroupEnd(this, 'aks.clusterResourceGroup.label', 'aksConfig.resourceGroup'),
        nodeResourceGroupEnd:    resourceGroupEnd(this, 'aks.nodeResourceGroup.label', 'aksConfig.nodeResourceGroup'),
        ipv4WithOrWithoutCidr:   ipv4WithOrWithoutCidr(this, 'aks.authirizedIpRanges.label', 'aksConfig.authorizedIpRanges'),
        serviceCidr:             ipv4WithCidr(this, 'aks.serviceCidr.label', 'aksConfig.serviceCidr'),
        podCidr:                 ipv4WithCidr(this, 'aks.podCidr.label', 'aksConfig.podCidr'),
        dockerBridgeCidr:        ipv4WithCidr(this, 'aks.dockerBridgeCidr.label', 'aksConfig.dockerBridgeCidr'),
        outboundType:            outboundTypeUserDefined(this, 'aks.outboundType.label', 'aksConfig.outboundType'),
        privateDnsZone:          privateDnsZone(this, 'aks.privateDnsZone.label', 'aksConfig.privateDnsZone'),
        poolNames:               nodePoolNames(this),
        poolNamesUnique:         nodePoolNamesUnique(this),
        poolCount:               nodePoolCount(this),

        vmSizeAvailable: () => {
          if (this.touchedVmSize) {
            let allAvailable = true;
            const badPools = [] as string[];

            this.nodePools.forEach((pool: AKSNodePool) => {
              if (!this.vmSizeOptions.find((opt: String) => opt === pool.vmSize)) {
                pool['_validSize'] = false;
                const { name } = pool;

                badPools.push(name);
                allAvailable = false;
              } else {
                pool['_validSize'] = true;
              }
            });
            if (!allAvailable) {
              return this.t('aks.nodePools.vmSize.notAvailableInRegion', { pool: badPools[0], count: badPools.length });
            }
          }

          return undefined;
        },

        k8sVersionAvailable: () => {
          if (this.touchedVersion) {
            if (!this.aksVersionOptions.find((v: any) => v.value === this.config.kubernetesVersion)) {
              return this.t('aks.kubernetesVersion.notAvailableInRegion');
            }
          }

          return undefined;
        },

        networkPolicyAvailable: () => {
          if (this.touchedVirtualNetwork && !!this.config.virtualNetwork) {
            if (!this.allVirtualNetworks.find((vn) => {
              return ( vn.name === this.config.virtualNetwork && vn.resourceGroup === this.config.virtualNetworkResourceGroup);
            })) {
              return this.t('aks.virtualNetwork.notAvailableInRegion');
            }
          }

          return undefined;
        },

        systemPoolRequired: () => {
          const systemPool = this.nodePools.find((pool: AKSNodePool) => pool.mode === 'System');

          return systemPool ? undefined : this.t('aks.nodePools.mode.systemRequired');
        },

        poolMinMax: () => {
          let allValid = true;

          this.nodePools.forEach((pool: AKSNodePool) => {
            const {
              count = 0, minCount = 0, maxCount = 0, enableAutoScaling
            } = pool;

            if (enableAutoScaling && (minCount > maxCount || count < minCount || count > maxCount) ) {
              pool._validation['_validMinMax'] = false;
              allValid = false;
            } else {
              pool._validation['_validMinMax'] = true;
            }
          });

          return allValid ? undefined : this.t('aks.errors.poolMinMax');
        },

        availabilityZoneSupport: (zones: string[]) => {
          if (this.canUseAvailabilityZones) {
            return undefined;
          }
          let isUsingAvailabilityZones = false;

          if (zones && zones.length) {
            isUsingAvailabilityZones = true;
          } else {
            this.nodePools.forEach((pool: AKSNodePool) => {
              if (pool.availabilityZones && pool.availabilityZones.length) {
                isUsingAvailabilityZones = true;
              }
            });
          }

          return this.canUseAvailabilityZones || !isUsingAvailabilityZones ? undefined : this.t('aks.errors.availabilityZones');
        },

        poolMin: (min?:number) => {
          if (min || min === 0) {
            return min < 0 || min > 1000 ? this.t('aks.errors.poolMin') : undefined;
          } else {
            let allValid = true;

            this.nodePools.forEach((pool: AKSNodePool) => {
              const poolMin = pool.minCount || 0;

              if (pool.enableAutoScaling && (poolMin < 0 || poolMin > 1000)) {
                pool._validation['_validMin'] = false;
                allValid = false;
              } else {
                pool._validation['_validMin'] = true;
              }
            });

            return allValid ? undefined : this.t('aks.errors.poolMin');
          }
        },

        poolMax: (max?:number) => {
          if (max || max === 0) {
            return max < 0 || max > 1000 ? this.t('aks.errors.poolMax') : undefined;
          } else {
            let allValid = true;

            this.nodePools.forEach((pool: AKSNodePool) => {
              const poolMax = pool.maxCount || 0;

              if (pool.enableAutoScaling && (poolMax < 0 || poolMax > 1000)) {
                pool._validation['_validMax'] = false;
                allValid = false;
              } else {
                pool._validation['_validMax'] = true;
              }
            });

            return allValid ? undefined : this.t('aks.errors.poolMax');
          }
        },

        poolTaints: (taint: string) => {
          if (taint && taint !== '') {
            const { key, value } = parseTaint(taint);

            return key === '' || value === '' ? this.t('aks.errors.poolTaints') : undefined;
          } else {
            let allValid = true;

            this.nodePools.forEach((pool) => {
              pool._validation['_validTaints'] = true;
              const taints = pool.nodeTaints || [];

              taints.forEach((taint:string) => {
                const { key, value } = parseTaint(taint);

                if (key === '' || value === '') {
                  allValid = false;
                  pool._validation['_validTaints'] = false;
                }
              });
            });

            return allValid ? undefined : this.t('aks.errors.poolTaints');
          }
        }

      };
    },

    // upstreamSpec will be null if the user created a cluster with some invalid options such that it ultimately fails to create anything in aks
    // this allows them to go back and correct their mistakes without re-making the whole cluster
    isNewOrUnprovisioned() {
      return this.mode === _CREATE || !this.normanCluster?.aksStatus?.upstreamSpec;
    },

    isEdit() {
      return this.mode === _CREATE || this.mode === _EDIT;
    },

    doneRoute() {
      return this.value?.listLocation?.name;
    },

    hasCredential() {
      return !!this.config?.azureCredentialSecret;
    },

    // filter out versions outside ui-k8s-supported-versions-range global setting and versions < current version
    // sort versions, descending
    aksVersionOptions(): Array<any> {
      const filteredAndSortable = this.allAksVersions.filter((v: string) => {
        if (this.supportedVersionRange && !semver.satisfies(v, this.supportedVersionRange)) {
          return false;
        }
        if (this.originalVersion && semver.gt(this.originalVersion, v)) {
          return false;
        }

        return true;
      }).map((v: string) => {
        let label = v;

        if (v === this.originalVersion) {
          label = this.t('aks.kubernetesVersion.current', { version: v });
        }

        return {
          value: v,
          label,
          sort:  sortable(v)
        };
      });

      const sorted = sortBy(filteredAndSortable, 'sort', true);

      if (!this.config.kubernetesVersion) {
        this.config['kubernetesVersion'] = sorted[0]?.value;
      }

      return sorted;
    },

    outboundTypeOptions(): Array<any> {
      const out = [{
        label: this.t('aks.outboundType.loadbalancer'),
        value: 'LoadBalancer'
      }, {
        label:    this.t('aks.outboundType.userDefined'),
        value:    'UserDefinedRouting',
        disabled: this.config.loadBalancerSku !== 'Standard'
      }];

      return out;
    },

    canEditLoadBalancerSKU(): Boolean {
      const poolsWithAZ = this.nodePools.filter((pool: AKSNodePool) => pool.availabilityZones && pool.availabilityZones.length);

      return !poolsWithAZ.length && this.isNewOrUnprovisioned;
    },

    hasAzureCNI(): Boolean {
      return this.config.networkPlugin === 'azure';
    },

    networkPolicyOptions(): Array<any> {
      return [{
        value: _NONE,
        label: this.t('generic.none')
      }, {
        value: 'calico',
        label: 'Calico',
      },
      {
        value:    'azure',
        label:    'Azure',
        disabled: !this.hasAzureCNI
      }
      ];
    },

    // in the labeledselect, networks will be shown as 'groups' with their subnets as selectable options
    // it is possible for a virtual network to have no subnets defined - they will be excluded from this list
    virtualNetworkOptions() {
      const out: {label: string, kind?: string, disabled?: boolean, value?: string, virtualNetwork?: any, key?: string}[] = [{ label: this.t('generic.none') }];

      if (this.loadingVirtualNetworks) {
        return out;
      }
      this.allVirtualNetworks.forEach((network) => {
        if (!network.subnets) {
          return;
        }
        const groupOpt = {
          label:    network.name,
          kind:     'group',
          disabled: true
        };

        out.push(groupOpt);
        network.subnets.forEach((sn) => {
          const label = sn.addressRange ? `${ sn.name } (${ sn.addressRange })` : sn.name;

          out.push({
            label,
            value:          sn.name,
            virtualNetwork: network,
            // subnet name and addressRange may not be unique within ALL virtual networks - setting a key here keeps v-select from complaining
            key:            label + network.name
          });
        });
      });

      return out;
    },

    virtualNetwork: {
      get() {
        return this.virtualNetworkOptions.find((opt) => opt.value === this.config.subnet) || this.t('generic.none');
      },
      set(neu: {label: string, kind?: string, disabled?: boolean, value?: string, virtualNetwork?: any}) {
        if (neu.label === this.t('generic.none')) {
          this.config['virtualNetwork'] = null;
          this.config['virtualNetworkResourceGroup'] = null;
          this.config['subnet'] = null;
        } else {
          const { virtualNetwork, value: subnetName } = neu;

          this.config['virtualNetwork'] = virtualNetwork.name;
          this.config['virtualNetworkResourceGroup'] = virtualNetwork.resourceGroup;
          this.config['subnet'] = subnetName;
        }
      }
    },

    networkPolicy: {
      get(): String {
        return this.config?.networkPolicy || _NONE;
      },
      set(neu: string): void {
        if (neu === _NONE) {
          this.config['networkPolicy'] = null;
        } else {
          this.config['networkPolicy'] = neu;
        }
      }
    },

    canEditPrivateCluster(): Boolean {
      return this.isNewOrUnprovisioned && !this.setAuthorizedIPRanges;
    },

    clusterId(): String | null {
      return this.value?.id || null;
    },

    canManageMembers(): Boolean {
      return canViewClusterMembershipEditor(this.$store);
    },

    canUseAvailabilityZones(): Boolean {
      return regionsWithAvailabilityZones[this.config.resourceLocation] || !this.config.resourceLocation;
    },

    canEnableNetworkPolicy(): Boolean {
      return this.networkPolicy !== 'none';
    },

    CREATE(): string {
      return _CREATE;
    },

    VIEW(): string {
      return _VIEW;
    },
  },

  watch: {
    canEditLoadBalancerSKU(neu) {
      if (!neu) {
        this.config['loadBalancerSku'] = 'Standard';
      }
    },

    hasAzureCNI(neu) {
      if (!neu) {
        if (this.config.networkPolicy === 'azure') {
          this.config['networkPolicy'] = undefined;
        }
      }
    },

    setAuthorizedIPRanges(neu) {
      if (neu) {
        this.config['privateCluster'] = false;
        delete this.config.managedIdentity;
        delete this.config.privateDnsZone;
        delete this.config.userAssignedIdentity;
      } else {
        this.config['authorizedIpRanges'] = [];
      }
    },

    canEnableNetworkPolicy(neu) {
      if (!neu) {
        this.value['enableNetworkPolicy'] = false;
      }
    },

    'config.azureCredentialSecret'(neu) {
      if (neu) {
        this.resetCredentialDependentProperties();
        this.getLocations();
      }
    },

    'config.resourceLocation'(neu) {
      if (neu) {
        this.getAksVersions();
        this.getVmSizes();
        this.getVirtualNetworks();
      }
    },

    // a validation error is shown if the region is changed and the below two fields are no longer valid -
    // if the user hasn't set them we should just update to a valid default and not show the error
    'config.virtualNetwork'(neu) {
      if (neu) {
        this.touchedVirtualNetwork = true;
      }
    },

    'config.kubernetesVersion'(neu, old) {
      if (neu && old) {
        this.touchedVersion = true;
      }
      this.nodePools.forEach((pool: AKSNodePool) => {
        if (pool._isNewOrUnprovisioned) {
          pool['orchestratorVersion'] = neu;
        }
      });
    },

    'config.privateCluster'(neu) {
      if (!neu) {
        delete this.config.managedIdentity;
        delete this.config.privateDnsZone;
        delete this.config.userAssignedIdentity;
      }
    },

    'config.monitoring'(neu: boolean) {
      if (!neu) {
        this.config['logAnalyticsWorkspaceGroup'] = null;
        this.config['logAnalyticsWorkspaceName'] = null;
      }
    }
  },

  methods: {
    // reset properties dependent on AKS queries so if they're lodaded with a valid credential then an invalid credential is selected, they're cleared
    resetCredentialDependentProperties(): void {
      this.locationOptions = [];
      this.allAksVersions = [];
      this.vmSizeOptions = [];
      this.allVirtualNetworks = [];
      if (this.mode === _CREATE) {
        delete this.config?.kubernetesVersion;
      }
      this['errors'] = [];
    },

    async getLocations(): Promise<void> {
      if (!this.isNewOrUnprovisioned) {
        return;
      }
      this.loadingLocations = true;
      // this will force the resourceLocation watcher to re-run every time new locations are fetched even if the default one selected hasn't changed
      this.config['resourceLocation'] = '';

      const { azureCredentialSecret } = this.config;

      try {
        const res = await getAKSRegions(this.$store, azureCredentialSecret, this.clusterId);

        // sort by availability zone support
        const withAZ = [] as Array<any>;
        const withoutAZ = [] as Array<any>;

        res.forEach((region: any) => {
          if (regionsWithAvailabilityZones[region.name]) {
            withAZ.push(region);
          } else {
            withoutAZ.push(region);
          }
        });
        this.locationOptions = [{ displayName: this.t('aks.location.withAZ'), kind: 'group' }, ...withAZ, { displayName: this.t('aks.location.withoutAZ'), kind: 'group' }, ...withoutAZ];
        if (!this.config?.resourceLocation) {
          if (res.find((r: any) => r.name === DEFAULT_REGION)) {
            this.config['resourceLocation'] = DEFAULT_REGION;
          } else {
            this.config['resourceLocation'] = res[0]?.name;
          }
        }
        this.loadingLocations = false;
      } catch (err: any) {
        this.loadingLocations = false;
        const parsedError = parseAzureError(err.error || '');
        const errors = this.errors as Array<string>;

        errors.push(this.t('aks.errors.regions', { e: parsedError || err }));
      }
    },

    async getAksVersions(): Promise<void> {
      this.loadingVersions = true;
      this.allAksVersions = [];
      const { azureCredentialSecret, resourceLocation } = this.config;

      try {
        const res = await getAKSKubernetesVersions(this.$store, azureCredentialSecret, resourceLocation, this.clusterId);

        // the default version is set once these are filtered and sorted in computed prop
        this.allAksVersions = res;
        this.loadingVersions = false;
      } catch (err:any) {
        this.loadingVersions = false;

        const parsedError = parseAzureError(err.error || '');
        const errors = this.errors as Array<string>;

        errors.push(this.t('aks.errors.kubernetesVersions', { e: parsedError || err }));
      }
    },

    async getVmSizes(): Promise<void> {
      this.loadingVmSizes = true;
      this.vmSizeOptions = [];
      const { azureCredentialSecret, resourceLocation } = this.config;

      try {
        const res = await getAKSVMSizes(this.$store, azureCredentialSecret, resourceLocation, this.clusterId);

        if (isArray(res)) {
          this.vmSizeOptions = res.sort();

          if (!this.vmSizeOptions.includes(this.defaultVmSize)) {
            this.defaultVmSize = '';
          }
        }

        this.loadingVmSizes = false;
      } catch (err: any) {
        this.loadingVmSizes = false;

        const parsedError = parseAzureError(err.error || '');
        const errors = this.errors as Array<string>;

        errors.push(this.t('aks.errors.vmSizes.fetching', { e: parsedError || err }));
      }
    },

    async getVirtualNetworks(): Promise<void> {
      this.loadingVirtualNetworks = true;
      this.allVirtualNetworks = [];
      const { azureCredentialSecret, resourceLocation } = this.config;

      try {
        const res = await getAKSVirtualNetworks(this.$store, azureCredentialSecret, resourceLocation, this.clusterId);

        if (res && isArray(res)) {
          this.allVirtualNetworks.push(...res);
        }

        this.loadingVirtualNetworks = false;
      } catch (err:any) {
        const parsedError = parseAzureError(err.error || '');
        const errors = this.errors as Array<string>;

        this.loadingVirtualNetworks = false;
        errors.push(this.t('aks.errors.virtualNetworks', { e: parsedError || err }));
      }
    },

    addPool(): void {
      let poolName = `pool${ this.nodePools.length }`;
      let mode: AKSPoolMode = 'User';
      const _id = randomStr();

      if (!this.nodePools.length) {
        poolName = 'agentpool';
        // there must be at least one System pool so if it's the first pool, default to that
        mode = 'System' as AKSPoolMode;
      }

      this.nodePools.push({
        ...defaultNodePool, name: poolName, _id, mode, vmSize: this.defaultVmSize, availabilityZones: this.canUseAvailabilityZones ? ['1', '2', '3'] : [], orchestratorVersion: this.config.kubernetesVersion
      });

      this.$nextTick(() => {
        if ( this.$refs.pools?.select ) {
          this.$refs.pools.select(poolName);
        }
      });
    },

    removePool(idx: number): void {
      const pool = this.nodePools[idx];

      removeObject(this.nodePools, pool);
    },

    poolIsValid(pool: AKSNodePool): boolean {
      const poolValidation = pool?._validation || {};

      return !Object.values(poolValidation).includes(false);
    },

    setClusterName(name: string): void {
      this.normanCluster['name'] = name;
      this.config['clusterName'] = name;
    },

    onMembershipUpdate(update: any): void {
      this['membershipUpdate'] = update;
    },

    async saveRoleBindings(): Promise<void> {
      if (this.membershipUpdate.save) {
        await this.membershipUpdate.save(this.normanCluster.id);
      }
    },

    // only save values that differ from upstream aks spec - see diffUpstreamSpec comments for details
    removeUnchangedConfigFields(): void {
      const upstreamConfig = this.normanCluster?.status?.aksStatus?.upstreamSpec;

      if (upstreamConfig) {
        const diff = diffUpstreamSpec(upstreamConfig, this.config);

        this.normanCluster['aksConfig'] = diff;
      }
    },

    async actuallySave(): Promise<void> {
      await this.normanCluster.save();

      return await this.normanCluster.waitForCondition('InitialRolesPopulated');
    },

    // fires when the 'cancel' button is pressed while the user is creating a new cloud credential
    cancelCredential(): void {
      if ( this.$refs.cruresource ) {
        (this.$refs.cruresource as any).emitOrRoute();
      }
    },
  },

});
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <CruResource
    v-else
    ref="cruresource"
    :resource="value"
    :mode="mode"
    :can-yaml="false"
    :done-route="doneRoute"
    :errors="fvUnreportedValidationErrors"
    :validation-passed="fvFormIsValid"
    @error="e=>errors=e"
    @finish="save"
  >
    <SelectCredential
      v-model:value="config.azureCredentialSecret"
      data-testid="cruaks-select-credential"
      :mode="mode === VIEW ? VIEW : CREATE"
      provider="azure"
      :default-on-cancel="true"
      :showing-form="hasCredential"
      class="mt-20"
      :cancel="cancelCredential"
    />
    <div
      v-if="hasCredential"
      class="mt-10"
      data-testid="cruaks-form"
    >
      <div class="row mb-10">
        <div class="col span-3">
          <LabeledInput
            :value="normanCluster.name"
            :mode="mode"
            label-key="generic.name"
            required
            :rules="fvGetAndReportPathRules('name')"
            @update:value="setClusterName"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            v-model:value="normanCluster.description"
            :mode="mode"
            label-key="nameNsDescription.description.label"
            :placeholder="t('nameNsDescription.description.placeholder')"
          />
        </div>
        <div
          class="col span-3"
        >
          <LabeledSelect
            v-model:value="config.resourceLocation"
            data-testid="cruaks-resourcelocation"
            :mode="mode"
            :options="locationOptions"
            option-label="displayName"
            option-key="name"
            label-key="aks.location.label"
            :reduce="opt=>opt.name"
            :loading="loadingLocations"
            required
            :disabled="!isNewOrUnprovisioned"
          />
        </div>
        <div
          class="col span-3"
        >
          <LabeledSelect
            v-model:value="config.kubernetesVersion"
            data-testid="cruaks-kubernetesversion"
            :mode="mode"
            :options="aksVersionOptions"
            label-key="aks.kubernetesVersion.label"
            option-key="value"
            option-label="label"
            :loading="loadingVersions"
            required
            :rules="fvGetAndReportPathRules('kubernetesVersion')"
          />
        </div>
      </div>
      <template v-if="config.resourceLocation && config.resourceLocation.length">
        <Banner
          v-if="!canUseAvailabilityZones"
          label-key="aks.location.azWarning"
          color="warning"
        />
        <div><h3>{{ t('aks.nodePools.title') }}</h3></div>
        <Tabbed
          ref="pools"
          :side-tabs="true"
          :show-tabs-add-remove="mode !== 'view'"
          :rules="fvGetAndReportPathRules('vmSize')"
          class="mb-20"
          @addTab="addPool($event)"
          @removeTab="removePool($event)"
        >
          <Tab
            v-for="(pool, i) in nodePools"
            :key="i"
            :name="pool._id || pool.name"
            :label="pool.name || t('aks.nodePools.notNamed')"
            :error="!poolIsValid(pool)"
          >
            <AksNodePool
              :mode="mode"
              :region="config.resourceLocation"
              :pool="pool"
              :vm-size-options="vmSizeOptions"
              :loading-vm-sizes="loadingVmSizes"
              :isPrimaryPool="i===0"
              :can-use-availability-zones="canUseAvailabilityZones"
              :validation-rules="{name: fvGetAndReportPathRules('poolName'),
                                  az: fvGetAndReportPathRules('poolAZ'),
                                  count: fvGetAndReportPathRules('poolCount'),
                                  min: fvGetAndReportPathRules('poolMin'),
                                  max: fvGetAndReportPathRules('poolMax'),
                                  minMax: fvGetAndReportPathRules('poolMinMax'),
                                  taints: fvGetAndReportPathRules('poolTaints')
              }"
              :original-cluster-version="originalVersion"
              :cluster-version="config.kubernetesVersion"
              @remove="removePool(pool)"
              @vmSizeSet="touchedVmSize = true"
            />
          </Tab>
        </Tabbed>

        <Accordion
          :open-initially="true"
          class="mb-20"
          title-key="aks.accordions.basics"
        >
          <div
            class="row mb-10 center-inputs"
          >
            <div class="col span-3">
              <LabeledInput
                v-model:value="config.linuxAdminUsername"
                :mode="mode"
                label-key="aks.linuxAdminUsername.label"
                :disabled="!isNewOrUnprovisioned"
                placeholder-key="aks.linuxAdminUsername.placeholder"
              />
            </div>
            <div class="col span-3">
              <LabeledInput
                v-model:value="config.resourceGroup"
                :mode="mode"
                label-key="aks.clusterResourceGroup.label"
                :disabled="!isNewOrUnprovisioned"
                :rules="fvGetAndReportPathRules('resourceGroup')"
                :required="true"
                placeholder-key="aks.clusterResourceGroup.placeholder"

                :tooltip="t('aks.clusterResourceGroup.tooltip')"
              />
            </div>
            <div class="col span-3">
              <LabeledInput
                v-model:value="config.nodeResourceGroup"
                :mode="mode"
                label-key="aks.nodeResourceGroup.label"
                :rules="fvGetAndReportPathRules('nodeResourceGroup')"
                :disabled="!isNewOrUnprovisioned"
                placeholder-key="aks.nodeResourceGroup.placeholder"
                :tooltip="t('aks.nodeResourceGroup.tooltip',null, true )"
              />
            </div>
            <div class="col span-3">
              <Checkbox
                v-model:value="config.monitoring"
                :mode="mode"
                label-key="aks.containerMonitoring.label"
                data-testid="aks-monitoring-checkbox"
              />
            </div>
          </div>

          <div class="row mb-10">
            <template v-if="config.monitoring">
              <div class="col span-3">
                <LabeledInput
                  v-model:value="config.logAnalyticsWorkspaceGroup"
                  :mode="mode"
                  label-key="aks.logAnalyticsWorkspaceGroup.label"
                  data-testid="aks-log-analytics-workspace-group-input"
                />
              </div>
              <div class="col span-3">
                <LabeledInput
                  v-model:value="config.logAnalyticsWorkspaceName"
                  :mode="mode"
                  label-key="aks.logAnalyticsWorkspaceName.label"
                  data-testid="aks-log-analytics-workspace-name-input"
                />
              </div>
            </template>
          </div>
          <div class="row mb-10">
            <div class="col span-6">
              <div class="ssh-key">
                <LabeledInput
                  v-model:value="config.sshPublicKey"
                  :mode="mode"
                  label-key="aks.sshPublicKey.label"
                  type="multiline"
                  placeholder-key="aks.sshPublicKey.placeholder"
                />
                <FileSelector
                  :mode="mode"
                  :label="t('aks.sshPublicKey.readFromFile')"
                  class="role-tertiary mt-10"
                  @selected="e => config.sshPublicKey = e"
                />
              </div>
            </div>
            <div class="col span-6">
              <KeyValue
                v-model:value="config.tags"
                :mode="mode"
                :title="t('aks.tags.label')"
                :add-label="t('aks.tags.addLabel')"
              >
                <template #title>
                  <div class="text-label">
                    {{ t('aks.tags.label') }}
                  </div>
                </template>
              </KeyValue>
            </div>
          </div>
        </Accordion>
        <Accordion
          class="mb-20"
          title-key="aks.accordions.networking"
          :open-initially="true"
        >
          <div class="row mb-10">
            <div class="col span-3">
              <LabeledSelect
                v-model:value="config.loadBalancerSku"
                label-key="aks.loadBalancerSku.label"
                :tooltip="t('aks.loadBalancerSku.tooltip')"
                :disabled="!canEditLoadBalancerSKU || !isNewOrUnprovisioned"
                :options="['Standard', 'Basic']"
              />
            </div>
            <div class="col span-3">
              <LabeledInput
                v-model:value="config.dnsPrefix"
                :mode="mode"
                label-key="aks.dns.label"
                :disabled="!isNewOrUnprovisioned"
                :required="true"
                :rules="fvGetAndReportPathRules('dnsPrefix')"
                placeholder-key="aks.dns.placeholder"
              />
            </div>
            <div class="col span-3">
              <LabeledSelect
                v-model:value="config.outboundType"
                :mode="mode"
                label-key="aks.dns.label"
                :disabled="!isNewOrUnprovisioned"
                :rules="fvGetAndReportPathRules('outboundType')"
                :options="outboundTypeOptions"
                :tooltip="t('aks.outboundType.tooltip')"
              />
            </div>
          </div>
          <div class="row mb-10">
            <div class="col span-3">
              <LabeledSelect
                v-model:value="config.networkPlugin"
                :mode="mode"
                :options="networkPluginOptions"
                label-key="aks.networkPlugin.label"
                :disabled="!isNewOrUnprovisioned"
              />
            </div>
            <div class="col span-3">
              <LabeledSelect
                v-model:value="networkPolicy"
                :mode="mode"
                :options="networkPolicyOptions"
                label-key="aks.networkPolicy.label"
                option-key="value"
                :reduce="opt=>opt.value"
                :tooltip="t('aks.networkPolicy.tooltip')"
                :disabled="!isNewOrUnprovisioned"
              />
            </div>
            <div
              class="col span-3"
            >
              <LabeledSelect
                :value="virtualNetwork"
                label-key="aks.virtualNetwork.label"
                :mode="mode"
                :options="virtualNetworkOptions"
                :loading="loadingVirtualNetworks"
                option-label="label"
                option-key="key"
                :disabled="!isNewOrUnprovisioned"
                :rules="fvGetAndReportPathRules('networkPolicy')"
                data-testid="aks-virtual-network-select"
                @selecting="(e)=>virtualNetwork = e"
              />
            </div>
          </div>

          <div class="row mb-10">
            <div class="col span-3">
              <LabeledInput
                v-model:value="config.serviceCidr"
                :mode="mode"
                label-key="aks.serviceCidr.label"
                :tooltip="t('aks.serviceCidr.tooltip')"
                :disabled="!isNewOrUnprovisioned"
                :rules="fvGetAndReportPathRules('serviceCidr')"
              />
            </div>
            <div class="col span-3">
              <LabeledInput
                v-model:value="config.podCidr"
                :mode="mode"
                label-key="aks.podCidr.label"
                :disabled="!isNewOrUnprovisioned"
                :rules="fvGetAndReportPathRules('podCidr')"
              />
            </div>
            <div class="col span-3">
              <LabeledInput
                v-model:value="config.dnsServiceIp"
                :mode="mode"
                label-key="aks.dnsServiceIp.label"
                :tooltip="t('aks.dnsServiceIp.tooltip')"
                :disabled="!isNewOrUnprovisioned"
              />
            </div>
            <div class="col span-3">
              <LabeledInput
                v-model:value="config.dockerBridgeCidr"
                :mode="mode"
                label-key="aks.dockerBridgeCidr.label"
                :tooltip="t('aks.dockerBridgeCidr.tooltip')"
                :disabled="!isNewOrUnprovisioned"
                :rules="fvGetAndReportPathRules('dockerBridgeCidr')"
              />
            </div>
          </div>

          <div class="row mb-10">
            <div class="networking-checkboxes col span-6">
              <Checkbox
                v-model:value="value.enableNetworkPolicy"
                :mode="mode"
                label-key="aks.enableNetworkPolicy.label"
                :disabled="!isNewOrUnprovisioned || !canEnableNetworkPolicy"
                :tooltip="t('aks.enableNetworkPolicy.tooltip')"
              />
              <Checkbox
                v-model:value="config.httpApplicationRouting"
                :mode="mode"
                label-key="aks.httpApplicationRouting.label"
              />
              <Checkbox
                v-model:value="config.privateCluster"
                :mode="mode"
                label-key="aks.privateCluster.label"
                :disabled="!canEditPrivateCluster"
                data-testid="cruaks-privateCluster"
              />
              <Checkbox
                v-model:value="setAuthorizedIPRanges"
                :mode="mode"
                label-key="aks.setAuthorizedIPRanges.label"
                :disabled="config.privateCluster"
              />
            </div>
            <div
              v-if="setAuthorizedIPRanges"
              class="col span-6"
            >
              <ArrayList
                v-model:value="config.authorizedIpRanges"
                :mode="mode"
                :initial-empty-row="true"
                value-placeholder="10.0.0.0/14"
                :label="t('aks.authorizedIpRanges.label')"
                :rules="fvGetAndReportPathRules('authorizedIpRanges')"
                @update:value="$emit('validationChanged')"
              >
                <template #title>
                  <div class="text-label">
                    {{ t('aks.authorizedIpRanges.label') }}
                  </div>
                </template>
              </ArrayList>
            </div>
          </div>
          <template v-if="config.privateCluster">
            <div class="row mb-10">
              <Banner
                color="warning"
                label-key="aks.privateCluster.warning"
                data-testid="cruaks-privateClusterBanner"
              />
            </div>
            <div class="row mb-10 center-inputs">
              <div class="col span-4">
                <LabeledInput
                  v-model:value="config.privateDnsZone"
                  :mode="mode"
                  label-key="aks.privateDnsZone.label"
                  :tooltip="t('aks.privateDnsZone.tooltip')"
                  :disabled="!isNewOrUnprovisioned"
                  :rules="fvGetAndReportPathRules('privateDnsZone')"
                  data-testid="cruaks-private-dns-zone"
                />
              </div>
              <div class="col span-4">
                <LabeledInput
                  v-model:value="config.userAssignedIdentity"
                  :mode="mode"
                  label-key="aks.userAssignedIdentity.label"
                  :tooltip="t('aks.userAssignedIdentity.tooltip')"
                  :disabled="!isNewOrUnprovisioned"
                  data-testid="cruaks-user-assigned-identity"
                />
              </div>
              <div class="col span-4">
                <Checkbox
                  v-model:value="config.managedIdentity"
                  :mode="mode"
                  label-key="aks.managedIdentity.label"
                  data-testid="cruaks-managed-identity"
                />
              </div>
            </div>
          </template>
        </Accordion>
        <Accordion
          class="mb-20"
          title-key="aks.accordions.clusterMembers"
        >
          <Banner
            v-if="isEdit"
            color="info"
          >
            {{ t('cluster.memberRoles.removeMessage') }}
          </Banner>
          <ClusterMembershipEditor
            v-if="canManageMembers"
            :mode="mode"
            :parent-id="normanCluster.id ? normanCluster.id : null"
            @membership-update="onMembershipUpdate"
          />
        </Accordion>
        <Accordion
          class="mb-20"
          title-key="aks.accordions.labels"
        >
          <Labels
            v-model:value="normanCluster"
            :mode="mode"
          />
        </Accordion>
      </template>
    </div>
    <template
      v-if="!hasCredential"
      #form-footer
    >
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>

<style lang="scss" scoped>
  .networking-checkboxes {
    display: flex;
    flex-direction: column;

    &>*{
      margin-bottom: 10px;
    }
  }

  .node-pool {
    padding: 10px;
  }

  .center-inputs {
    display: flex;
    align-items: center;
  }

</style>
