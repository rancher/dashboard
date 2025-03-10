<script>
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import ResourceTable, { defaultTableSortGenerationFn } from '@shell/components/ResourceTable';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import SortableTable from '@shell/components/SortableTable';
import CopyCode from '@shell/components/CopyCode';
import Tab from '@shell/components/Tabbed/Tab';
import { allHash } from '@shell/utils/promise';
import { CAPI, MANAGEMENT, NORMAN, SNAPSHOT } from '@shell/config/types';
import {
  STATE, NAME as NAME_COL, AGE, AGE_NORMAN, INTERNAL_EXTERNAL_IP, STATE_NORMAN, ROLES, MACHINE_NODE_OS, MANAGEMENT_NODE_OS, NAME,
} from '@shell/config/table-headers';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import CustomCommand from '@shell/edit/provisioning.cattle.io.cluster/CustomCommand';
import AsyncButton from '@shell/components/AsyncButton.vue';
import AnsiUp from 'ansi_up';
import day from 'dayjs';
import { addParams } from '@shell/utils/url';
import { base64Decode } from '@shell/utils/crypto';
import { DATE_FORMAT, TIME_FORMAT, SCALE_POOL_PROMPT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';
import MachineSummaryGraph from '@shell/components/formatter/MachineSummaryGraph';
import Socket, {
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR
} from '@shell/utils/socket';
import { get } from '@shell/utils/object';
import CapiMachineDeployment from '@shell/models/cluster.x-k8s.io.machinedeployment';
import { isAlternate } from '@shell/utils/platform';

let lastId = 1;
const ansiup = new AnsiUp();

/**
 * Machine Deployment has a reference to the 'template' used to create that deployment
 * For an empty machine pool, we (obviously) don't get any machine deployments for that pool.
 *
 * This class allows us to fake a machine deployment - when created, we set additional properties (_cluster etc)
 * and use these in the getters.
 **/
class EmptyCapiMachineDeployment extends CapiMachineDeployment {
  get inClusterSpec() {
    return this._clusterSpec;
  }

  get cluster() {
    return this._cluster;
  }

  get template() {
    return this._template;
  }
}

export default {
  emits: ['input'],

  components: {
    Loading,
    Banner,
    ResourceTable,
    ResourceTabs,
    SortableTable,
    Tab,
    CopyCode,
    CustomCommand,
    AsyncButton,
    MachineSummaryGraph,
  },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  async fetch() {
    await this.value.waitForProvisioner();

    // Support for the 'provisioner' extension
    const extClass = this.$plugin.getDynamic('provisioner', this.value.machineProvider);

    if (extClass) {
      this.extProvider = new extClass({
        dispatch: this.$store.dispatch,
        getters:  this.$store.getters,
        axios:    this.$store.$axios,
        $plugin:  this.$store.app.$plugin,
        $t:       this.t
      });

      this.extDetailTabs = {
        ...this.extDetailTabs,
        ...this.extProvider.detailTabs
      };
      this.extCustomParams = { provider: this.value.machineProvider };
    }

    // Support for a model extension
    if (this.value.customProvisionerHelper) {
      this.extDetailTabs = {
        ...this.extDetailTabs,
        ...this.value.customProvisionerHelper.detailTabs
      };
      this.extCustomParams = { provider: this.value.machineProvider };
    }

    const schema = this.$store.getters[`management/schemaFor`](CAPI.RANCHER_CLUSTER);
    const fetchOne = { schemaDefinitions: schema.fetchResourceFields() };

    if ( this.$store.getters['management/canList'](CAPI.MACHINE_DEPLOYMENT) ) {
      fetchOne.machineDeployments = this.$store.dispatch('management/findAll', { type: CAPI.MACHINE_DEPLOYMENT });
    }

    if ( this.$store.getters['management/canList'](CAPI.MACHINE) ) {
      fetchOne.machines = this.$store.dispatch('management/findAll', { type: CAPI.MACHINE });
    }

    if ( this.$store.getters['management/canList'](SNAPSHOT) ) {
      fetchOne.snapshots = this.$store.dispatch('management/findAll', { type: SNAPSHOT });
    }

    if ( this.value.isImported || this.value.isCustom || this.value.isHostedKubernetesProvider ) {
      fetchOne.clusterToken = this.value.getOrCreateToken();
    }

    // Need to get Norman clusters so that we can check if user has permissions to access the local cluster
    if ( this.$store.getters['rancher/canList'](NORMAN.CLUSTER) ) {
      fetchOne.normanClusters = this.$store.dispatch('rancher/findAll', { type: NORMAN.CLUSTER });
    }

    if ( this.value.isRke1 && this.$store.getters['isRancher'] ) {
      fetchOne.etcdBackups = this.$store.dispatch('rancher/findAll', { type: NORMAN.ETCD_BACKUP });

      fetchOne.normanNodePools = this.$store.dispatch('rancher/findAll', { type: NORMAN.NODE_POOL });
    }

    const fetchOneRes = await allHash(fetchOne);

    this.allMachines = fetchOneRes.machines || [];
    this.allMachineDeployments = fetchOneRes.machineDeployments || [];
    this.haveMachines = !!fetchOneRes.machines;
    this.haveDeployments = !!fetchOneRes.machineDeployments;
    this.clusterToken = fetchOneRes.clusterToken;
    this.etcdBackups = fetchOneRes.etcdBackups;

    if (fetchOneRes.normanClusters) {
      // Does the user have access to the local cluster? Need to in order to be able to show the 'Related Resources' tab
      this.hasLocalAccess = !!fetchOneRes.normanClusters.find((c) => c.internal);
    }

    const fetchTwo = {};

    const thisClusterMachines = this.allMachineDeployments.filter((deployment) => {
      return deployment?.spec?.clusterName === this.value.metadata.name;
    });

    const machineDeploymentTemplateType = thisClusterMachines?.[0]?.templateType;

    if (machineDeploymentTemplateType && this.$store.getters['management/schemaFor'](machineDeploymentTemplateType) ) {
      fetchTwo.mdtt = this.$store.dispatch('management/findAll', { type: machineDeploymentTemplateType });
    }

    if (!this.showMachines) {
      if ( this.$store.getters['management/canList'](MANAGEMENT.NODE) ) {
        fetchTwo.allNodes = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
      }

      if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_POOL) ) {
        fetchTwo.allNodePools = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
      }

      if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_TEMPLATE) ) {
        fetchTwo.nodeTemplates = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
      }
    }

    const fetchTwoRes = await allHash(fetchTwo);

    this.allNodes = fetchTwoRes.allNodes || [];
    this.haveNodes = !!fetchTwoRes.allNodes;
    this.allNodePools = fetchTwoRes.allNodePools || [];
    this.haveNodePools = !!fetchTwoRes.allNodePools;
    this.machineTemplates = fetchTwoRes.mdtt || [];

    // Fetch RKE template revisions so we can show when an updated template is available
    // This request does not need to be blocking
    if ( this.$store.getters['management/canList'](MANAGEMENT.RKE_TEMPLATE) ) {
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.RKE_TEMPLATE });
    }

    if ( this.$store.getters['management/canList'](MANAGEMENT.RKE_TEMPLATE_REVISION) ) {
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.RKE_TEMPLATE_REVISION });
    }
  },

  created() {
    if ( this.showLog ) {
      this.connectLog();
    }
  },

  beforeUnmount() {
    if ( this.logSocket ) {
      this.logSocket.disconnect();
      this.logSocket = null;
    }
  },

  data() {
    return {

      allMachines:           [],
      allMachineDeployments: [],
      allNodes:              [],
      allNodePools:          [],

      haveMachines:    false,
      haveDeployments: false,
      haveNodes:       false,
      haveNodePools:   false,
      hasLocalAccess:  false,

      mgmtNodeSchema: this.$store.getters[`management/schemaFor`](MANAGEMENT.NODE),
      machineSchema:  this.$store.getters[`management/schemaFor`](CAPI.MACHINE),

      clusterToken: null,
      etcdBackups:  null,

      logOpen:   false,
      logSocket: null,
      logs:      [],

      extProvider:     null,
      extCustomParams: null,
      extDetailTabs:   {
        machines:     true, // in this component
        logs:         true, // in this component
        registration: true, // in this component
        snapshots:    true, // in this component
        related:      true, // in ResourceTabs
        events:       true, // in ResourceTabs
        conditions:   true, // in ResourceTabs
      },

      showWindowsWarning: false
    };
  },

  watch: {
    showNodes(neu) {
      if (neu) {
        this.$store.dispatch('rancher/findAll', { type: NORMAN.NODE });
      }
    },
  },

  computed: {
    defaultTab() {
      if (this.showRegistration) {
        if (this.value.isRke2 ? !this.machines?.length : !this.nodes?.length) {
          return 'registration';
        }
      }

      if (this.showMachines) {
        return 'machine-pools';
      }

      if (this.showNodes) {
        return 'node-pools';
      }

      return '';
    },

    // Used to show summary graph for each node pool group in the machine pool table
    poolSummaryInfo() {
      const info = {};

      this.value?.pools.forEach((p) => {
        const group = `[${ p.type }: ${ p.id }]`;

        info[group] = p;
      });

      return info;
    },

    fakeMachines() {
      const machineNameFn = (clusterName, machinePoolName) => `${ clusterName }-${ machinePoolName }`;

      // When we scale up, the quantity will change to N+1 - so from 0 to 1, the quantity changes,
      // but it takes tiem for the machine to appear, so the pool is empty, but if we just go off on a non-zero quqntity
      // then the pool would be hidden - so we find empty pool by checking the machines
      const emptyPools = (this.value.spec.rkeConfig?.machinePools || []).filter((mp) => {
        const machineFullName = machineNameFn(this.value.name, mp.name);

        const machines = this.value.machines.filter((machine) => {
          const isElementalCluster = machine.spec?.infrastructureRef?.apiVersion.startsWith('elemental.cattle.io');
          const machinePoolInfName = machine.spec?.infrastructureRef?.name;

          if (isElementalCluster) {
            return machinePoolInfName.includes(machineFullName);
          }

          // if labels exist, then the machineFullName must unequivocally be equal to manchineLabelFullName (based on labels)
          const machineLabelClusterName = machine.metadata?.labels?.['cluster.x-k8s.io/cluster-name'];
          const machineLabelPoolName = machine.metadata?.labels?.['rke.cattle.io/rke-machine-pool-name'];

          if (machineLabelClusterName && machineLabelPoolName) {
            const manchineLabelFullName = machineNameFn(machineLabelClusterName, machineLabelPoolName);

            return machineFullName === manchineLabelFullName;
          }

          return machinePoolInfName.startsWith(machineFullName);
        });

        return machines.length === 0;
      });

      // When a deployment has no machines it's not shown.... so add a fake machine to it
      // This is a catch all scenario seen in older node pool world but not deployments
      return emptyPools.map((mp, i) => {
        const pool = new EmptyCapiMachineDeployment(
          {
            id:       i,
            metadata: {
              name:      `${ this.value.nameDisplay }-${ mp.name }`,
              namespace: this.value.namespace,
            },
            spec: {}
          },
          {
            getters:     this.$store.getters,
            rootGetters: this.$root.$store.getters,
          }
        );

        const templateNamePrefix = `${ pool.metadata.name }-`;

        // All of these properties are needed to ensure the pool displays correctly and that we can scale up and down
        pool._template = this.machineTemplates.find((t) => t.metadata.name.startsWith(templateNamePrefix));
        pool._cluster = this.value;
        pool._clusterSpec = mp;

        return {
          poolId:           pool.id,
          mainRowKey:       'isFake',
          pool,
          availableActions: []
        };
      });
    },

    machines() {
      return [...this.value.machines, ...this.fakeMachines];
    },

    nodes() {
      const nodes = this.allNodes.filter((x) => x.mgmtClusterId === this.value.mgmtClusterId);

      return [...nodes, ...this.fakeNodes];
    },

    fakeNodes() {
      // When a pool has no nodes it's not shown.... so add a fake node to it
      const emptyNodePools = this.allNodePools.filter((x) => x.spec.clusterName === this.value.mgmtClusterId && x.spec.quantity === 0);

      return emptyNodePools.map((np) => ({
        spec:             { nodePoolName: np.id.replace('/', ':') },
        mainRowKey:       'isFake',
        pool:             np,
        availableActions: []
      }));
    },

    showMachines() {
      const showMachines = this.haveMachines && (this.value.isRke2 || !!this.machines.length);

      return showMachines && this.extDetailTabs.machines;
    },

    showNodes() {
      return !this.showMachines && this.haveNodes && !!this.nodes.length && this.extDetailTabs.machines;
    },

    showSnapshots() {
      if (this.value.isRke1) {
        return this.$store.getters['rancher/canList'](NORMAN.ETCD_BACKUP) && this.extDetailTabs.snapshots;
      } else if (this.value.isRke2) {
        return this.$store.getters['management/canList'](SNAPSHOT) && this.extDetailTabs.snapshots;
      }

      return false;
    },

    showEksNodeGroupWarning() {
      if ( this.value.provisioner === 'EKS' && this.value.state !== STATES_ENUM.ACTIVE) {
        const desiredTotal = this.value.eksNodeGroups.filter((g) => g.desiredSize === 0);

        if ( desiredTotal.length === this.value.eksNodeGroups.length ) {
          return true;
        }
      }

      return false;
    },

    machineHeaders() {
      return [
        STATE,
        NAME_COL,
        {
          name:          'node-name',
          labelKey:      'tableHeaders.machineNodeName',
          sort:          'status.nodeRef.name',
          value:         'status.nodeRef.name',
          formatter:     'LinkDetail',
          formatterOpts: { reference: 'kubeNodeDetailLocation' },
          dashIfEmpty:   true,
        },
        INTERNAL_EXTERNAL_IP,
        MACHINE_NODE_OS,
        ROLES,
        AGE,
      ];
    },

    mgmtNodeSchemaHeaders() {
      return [
        STATE, NAME_COL,
        {
          name:          'node-name',
          labelKey:      'tableHeaders.machineNodeName',
          sort:          'kubeNodeName',
          value:         'kubeNodeName',
          formatter:     'LinkDetail',
          formatterOpts: { reference: 'kubeNodeDetailLocation' },
          dashIfEmpty:   true,
        },
        INTERNAL_EXTERNAL_IP,
        MANAGEMENT_NODE_OS,
        ROLES,
        AGE
      ];
    },

    rke1Snapshots() {
      const mgmtId = this.value.mgmt?.id;

      if ( !mgmtId ) {
        return [];
      }

      return (this.etcdBackups || []).filter((x) => x.clusterId === mgmtId);
    },

    rke2Snapshots() {
      return this.value.etcdSnapshots;
    },

    rke1SnapshotHeaders() {
      return [
        STATE_NORMAN,
        {
          name:          'name',
          labelKey:      'tableHeaders.name',
          value:         'nameDisplay',
          sort:          ['nameSort'],
          canBeVariable: true,
        },
        {
          name:     'version',
          labelKey: 'tableHeaders.version',
          value:    'status.kubernetesVersion',
          sort:     'status.kubernetesVersion',
          width:    150,
        },
        { ...AGE_NORMAN, canBeVariable: true },
        {
          name:      'manual',
          labelKey:  'tableHeaders.manual',
          value:     'manual',
          formatter: 'Checked',
          sort:      ['manual'],
          align:     'center',
          width:     50,
        },
      ];
    },

    rke2SnapshotHeaders() {
      return [
        {
          ...STATE_NORMAN, value: 'snapshotFile.status', formatterOpts: { arbitrary: true }
        },
        NAME,
        {
          name:      'size',
          labelKey:  'tableHeaders.size',
          value:     'snapshotFile.size',
          sort:      'snapshotFile.size',
          formatter: 'Si',
          width:     150,
        },
        {
          ...AGE,
          sort:          'snapshotFile.createdAt:desc',
          canBeVariable: true
        },
      ];
    },

    showRegistration() {
      if ( !this.clusterToken ) {
        return false;
      }

      if ( this.value.isCustom ) {
        return this.extDetailTabs.registration;
      }

      if ( this.value.isImported ) {
        return !this.value.mgmt?.isReady && this.extDetailTabs.registration;
      }

      // Hosted kubernetes providers with private endpoints need the registration tab
      // https://github.com/rancher/dashboard/issues/6036
      // https://github.com/rancher/dashboard/issues/4545
      if ( this.value.isHostedKubernetesProvider && this.value.isPrivateHostedProvider && !this.isClusterReady ) {
        return this.extDetailTabs.registration;
      }

      return false;
    },

    isClusterReady() {
      return this.value.mgmt?.isReady;
    },

    showLog() {
      const showLog = this.value.mgmt?.hasLink('log');

      return showLog && this.extDetailTabs.logs;
    },

    dateTimeFormatStr() {
      const dateFormat = escapeHtml( this.$store.getters['prefs/get'](DATE_FORMAT));

      return `${ dateFormat } ${ this.timeFormatStr }`;
    },

    timeFormatStr() {
      return escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));
    },

    hasWindowsMachine() {
      return this.machines.some((machine) => get(machine, 'status.nodeInfo.operatingSystem') === 'windows');
    },

    snapshotsGroupBy() {
      return 'backupLocation';
    },

    extDetailTabsRelated() {
      return this.extDetailTabs?.related;
    },

    extDetailTabsEvents() {
      return this.extDetailTabs?.events;
    },

    extDetailTabsConditions() {
      return this.extDetailTabs?.conditions;
    }
  },

  methods: {
    toggleScaleDownModal( event, resources ) {
      // Check if the user held alt key when an action is clicked.
      const alt = isAlternate(event);
      const showScalePoolPrompt = this.$store.getters['prefs/get'](SCALE_POOL_PROMPT);

      // Prompt if showScalePoolPrompt pref not store and user did not held alt key
      if (!alt && !showScalePoolPrompt) {
        this.$store.dispatch('management/promptModal', {
          component:  'ScalePoolDownDialog',
          resources,
          modalWidth: '450px'
        });
      } else {
        // User held alt key, so don't prompt
        resources.scalePool(-1);
      }
    },

    async takeSnapshot(btnCb) {
      try {
        await this.value.takeSnapshot();

        // Give the change event some time to show up
        setTimeout(() => {
          btnCb(true);
        }, 1000);
      } catch (err) {
        this.$store.dispatch('growl/fromError', { title: 'Error creating snapshot', err });
        btnCb(false);
      }
    },

    showPoolAction(event, pool) {
      this.$store.commit(`action-menu/show`, {
        resources: [pool],
        elem:      event.target
      });
    },

    showPoolActionButton(pool) {
      return !!pool.availableActions?.length;
    },

    async connectLog() {
      if ( this.logSocket ) {
        await this.logSocket.disconnect();
        this.logSocket = null;
      }

      const params = {
        follow:     true,
        timestamps: true,
        pretty:     true,
      };

      let url = this.value.mgmt?.linkFor('log');

      url = addParams(url.replace(/^http/, 'ws'), params);

      this.logSocket = new Socket(url, true, 0);
      this.logSocket.addEventListener(EVENT_CONNECTED, (e) => {
        this.logs = [];
        this.logOpen = true;
      });

      this.logSocket.addEventListener(EVENT_DISCONNECTED, (e) => {
        this.logOpen = false;
      });

      this.logSocket.addEventListener(EVENT_CONNECT_ERROR, (e) => {
        this.logOpen = false;
        console.error('Connect Error', e); // eslint-disable-line no-console
      });

      this.logSocket.addEventListener(EVENT_MESSAGE, (e) => {
        const line = base64Decode(e.detail.data);

        let msg = line;
        let time = null;

        const idx = line.indexOf(' ');

        if ( idx > 0 ) {
          const timeStr = line.substr(0, idx);
          const date = new Date(timeStr);

          if ( !isNaN(date.getSeconds()) ) {
            time = date.toISOString();
            msg = line.substr(idx + 1);
          }
        }

        this.logs.push({
          id:     lastId++,
          msg:    ansiup.ansi_to_html(msg),
          rawMsg: msg,
          time,
        });
      });

      this.logSocket.connect();
    },

    format(time) {
      if ( !time ) {
        return '';
      }

      const val = day(time);
      const today = day().format('YYYY-MM-DD');

      if ( val.format('YYYY-MM-DD') === today ) {
        return day(time).format(this.timeFormatStr);
      } else {
        return day(time).format(this.dateTimeFormatStr);
      }
    },

    machineSortGenerationFn() {
      // The sort generation function creates a unique value and is used to create a key including sort details.
      // The unique key determines if the list is redrawn or a cached version is shown.
      // Because we ensure the 'not in a pool' group is there via a row, and timing issues, the unqiue key doesn't change
      // after a machine is added/removed... so the list won't update... so we need to inject a string to ensure the key is fresh
      const base = defaultTableSortGenerationFn(this.machineSchema, this.$store);

      return base + (!!this.fakeMachines.length ? '-fake' : '');
    },

    nodeSortGenerationFn() {
      // The sort generation function creates a unique value and is used to create a key including sort details.
      // The unique key determines if the list is redrawn or a cached version is shown.
      // Because we ensure the 'not in a pool' group is there via a row, and timing issues, the unqiue key doesn't change
      // after a machine is added/removed... so the list won't update... so we need to inject a string to ensure the key is fresh
      const base = defaultTableSortGenerationFn(this.mgmtNodeSchema, this.$store);

      return base + (!!this.fakeNodes.length ? '-fake' : '');
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Banner
      v-if="showWindowsWarning"
      color="error"
      :label="t('cluster.banner.os', { newOS: 'Windows', existingOS: 'Linux' })"
    />
    <Banner
      v-if="showEksNodeGroupWarning"
      color="error"
      :label="t('cluster.banner.desiredNodeGroupWarning')"
    />

    <Banner
      v-if="$fetchState.error"
      color="error"
      :label="$fetchState.error"
    />

    <Banner
      v-if="value.isRke1"
      color="warning"
      label-key="cluster.banner.rke1DeprecationMessage"
    />
    <ResourceTabs
      :value="value"
      :default-tab="defaultTab"
      :need-related="hasLocalAccess"
      :extension-params="extCustomParams"
      :needRelated="extDetailTabsRelated"
      :needEvents="extDetailTabsEvents"
      :needConditions="extDetailTabsConditions"
      @update:value="$emit('input', $event)"
    >
      <Tab
        v-if="showMachines"
        name="machine-pools"
        :label-key="value.isCustom ? 'cluster.tabs.machines' : 'cluster.tabs.machinePools'"
        :weight="4"
      >
        <ResourceTable
          :rows="machines"
          :schema="machineSchema"
          :headers="machineHeaders"
          default-sort-by="name"
          :group-by="value.isCustom ? null : 'poolId'"
          group-ref="pool"
          :group-sort="['pool.nameDisplay']"
          :sort-generation-fn="machineSortGenerationFn"
          :hide-grouping-controls="true"
        >
          <template #main-row:isFake="{fullColspan}">
            <tr class="main-row">
              <td
                :colspan="fullColspan"
                class="no-entries"
              >
                {{ t('node.list.noNodes') }}
              </td>
            </tr>
          </template>

          <template #group-by="{group}">
            <div
              class="pool-row"
              :class="{'has-description':group.ref && group.ref.template}"
            >
              <div
                v-trim-whitespace
                class="group-tab"
              >
                <div
                  v-if="group && group.ref"
                  v-clean-html="group.ref.groupByPoolShortLabel"
                />
                <div
                  v-else
                  v-clean-html="t('resourceTable.groupLabel.notInANodePool')"
                />
                <div
                  v-if="group.ref && group.ref.providerSummary"
                  class="description text-muted text-small"
                >
                  {{ group.ref.providerSummary }}
                </div>
              </div>
              <div
                v-if="group.ref"
                class="right group-header-buttons mr-20"
              >
                <MachineSummaryGraph
                  v-if="poolSummaryInfo[group.ref]"
                  :row="poolSummaryInfo[group.ref]"
                  :horizontal="true"
                  class="mr-20"
                />
                <template v-if="value.hasLink('update') && group.ref.showScalePool">
                  <button
                    v-clean-tooltip="t('node.list.scaleDown')"
                    :disabled="!group.ref.canScaleDownPool()"
                    type="button"
                    class="btn btn-sm role-secondary"
                    @click="toggleScaleDownModal($event, group.ref)"
                  >
                    <i class="icon icon-sm icon-minus" />
                  </button>
                  <button
                    v-clean-tooltip="t('node.list.scaleUp')"
                    :disabled="!group.ref.canScaleUpPool()"
                    type="button"
                    class="btn btn-sm role-secondary ml-10"
                    @click="group.ref.scalePool(1)"
                  >
                    <i class="icon icon-sm icon-plus" />
                  </button>
                </template>
              </div>
            </div>
          </template>
        </ResourceTable>
      </Tab>

      <Tab
        v-else-if="showNodes"
        name="node-pools"
        :label-key="value.isCustom ? 'cluster.tabs.machines' : 'cluster.tabs.machinePools'"
        :weight="4"
      >
        <ResourceTable
          :schema="mgmtNodeSchema"
          :headers="mgmtNodeSchemaHeaders"
          :rows="nodes"
          :group-by="value.isCustom ? null : 'spec.nodePoolName'"
          group-ref="pool"
          :group-sort="['pool.nameDisplay']"
          :sort-generation-fn="nodeSortGenerationFn"
          :hide-grouping-controls="true"
        >
          <template #main-row:isFake="{fullColspan}">
            <tr class="main-row">
              <td
                :colspan="fullColspan"
                class="no-entries"
              >
                {{ t('node.list.noNodes') }}
              </td>
            </tr>
          </template>

          <template #group-by="{group}">
            <div
              class="pool-row"
              :class="{'has-description':group.ref && group.ref.nodeTemplate}"
            >
              <div
                v-trim-whitespace
                class="group-tab"
              >
                <div
                  v-if="group.ref"
                  v-clean-html="t('resourceTable.groupLabel.nodePool', { name: group.ref.spec.hostnamePrefix}, true)"
                />
                <div
                  v-else
                  v-clean-html="t('resourceTable.groupLabel.notInANodePool')"
                />
                <div
                  v-if="group.ref && group.ref.nodeTemplate"
                  class="description text-muted text-small"
                >
                  {{ group.ref.providerDisplay }} &ndash;  {{ group.ref.providerLocation }} / {{ group.ref.providerSize }} ({{ group.ref.providerName }})
                </div>
              </div>
              <div
                v-if="group.ref"
                class="right group-header-buttons"
              >
                <MachineSummaryGraph
                  :row="poolSummaryInfo[group.ref]"
                  :horizontal="true"
                  class="mr-20"
                />
                <template v-if="group.ref.hasLink('update')">
                  <button
                    v-clean-tooltip="t('node.list.scaleDown')"
                    :disabled="!group.ref.canScaleDownPool()"
                    type="button"
                    class="btn btn-sm role-secondary"
                    @click="toggleScaleDownModal($event, group.ref)"
                  >
                    <i class="icon icon-sm icon-minus" />
                  </button>
                  <button
                    v-clean-tooltip="t('node.list.scaleUp')"
                    type="button"
                    class="btn btn-sm role-secondary ml-10"
                    @click="group.ref.scalePool(1)"
                  >
                    <i class="icon icon-sm icon-plus" />
                  </button>
                </template>

                <button
                  type="button"
                  class="project-action btn btn-sm role-multi-action actions mr-5 ml-15"
                  :class="{invisible: !showPoolActionButton(group.ref)}"
                  @click="showPoolAction($event, group.ref)"
                >
                  <i class="icon icon-actions" />
                </button>
              </div>
            </div>
          </template>
        </ResourceTable>
      </Tab>

      <Tab
        v-if="showLog"
        name="log"
        :label="t('cluster.tabs.log')"
        :weight="3"
        class="logs-container"
      >
        <table
          class="fixed"
          cellpadding="0"
          cellspacing="0"
        >
          <tbody class="logs-body">
            <template v-if="logs.length">
              <tr
                v-for="(line, i) in logs"
                :key="i"
              >
                <td
                  v-clean-html="format(line.time)"
                  class="time"
                />
                <td
                  v-clean-html="line.msg"
                  class="msg"
                />
              </tr>
            </template>
            <tr
              v-else-if="!logOpen"
              v-t="'cluster.log.connecting'"
              colspan="2"
              class="msg text-muted"
            />
            <tr
              v-else
              v-t="'cluster.log.noData'"
              colspan="2"
              class="msg text-muted"
            />
          </tbody>
        </table>
      </Tab>

      <Tab
        v-if="showRegistration"
        name="registration"
        :label="t('cluster.tabs.registration')"
        :weight="2"
      >
        <Banner
          v-if="!value.isCustom"
          color="warning"
          :label="t('cluster.import.warningBanner')"
        />
        <CustomCommand
          v-if="value.isCustom"
          :cluster-token="clusterToken"
          :cluster="value"
          @copied-windows="hasWindowsMachine ? null : showWindowsWarning = true"
        />
        <template v-else>
          <h4 v-clean-html="t('cluster.import.commandInstructions', null, true)" />
          <CopyCode class="m-10 p-10">
            {{ clusterToken.command }}
          </CopyCode>

          <h4
            v-clean-html="t('cluster.import.commandInstructionsInsecure', null, true)"
            class="mt-10"
          />
          <CopyCode class="m-10 p-10">
            {{ clusterToken.insecureCommand }}
          </CopyCode>

          <h4
            v-clean-html="t('cluster.import.clusterRoleBindingInstructions', null, true)"
            class="mt-10"
          />
          <CopyCode class="m-10 p-10">
            {{ t('cluster.import.clusterRoleBindingCommand', null, true) }}
          </CopyCode>
        </template>
      </Tab>

      <Tab
        v-if="showSnapshots"
        name="snapshots"
        label="Snapshots"
        :weight="1"
      >
        <SortableTable
          class="snapshots"
          :data-testid="'cluster-snapshots-list'"
          :headers="value.isRke1 ? rke1SnapshotHeaders : rke2SnapshotHeaders"
          default-sort-by="age"
          :table-actions="value.isRke1"
          :rows="value.isRke1 ? rke1Snapshots : rke2Snapshots"
          :search="false"
          :groupable="true"
          :group-by="snapshotsGroupBy"
        >
          <template #header-right>
            <AsyncButton
              mode="snapshot"
              class="btn role-primary"
              :disabled="!isClusterReady"
              @click="takeSnapshot"
            />
          </template>
          <template #group-by="{group}">
            <div class="group-bar">
              <div class="group-tab">
                {{ t('cluster.snapshot.groupLabel') }}: {{ group.key }}
              </div>
            </div>
          </template>
        </SortableTable>
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang='scss' scoped>
.main-row .no-entries {
  text-align: center;
}

.pool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.has-description {
    .group-tab {
      &, &::after {
          height: 50px;
      }

      &::after {
          right: -20px;
      }

      .description {
          margin-top: -20px;
      }
    }
  }
  .group-header-buttons {
    align-items: center;
    display: flex;
  }
}

.logs-container {
  height: 100%;
  overflow: auto;
  padding: 5px;
  background-color: var(--logs-bg);
  font-family: Menlo,Consolas,monospace;
  color: var(--logs-text);

  .closed {
    opacity: 0.25;
  }

  .time {
    white-space: nowrap;
    width: auto;
    padding-right: 15px;
    user-select: none;
  }

  .msg {
    white-space: normal;

    .highlight {
      color: var(--logs-highlight);
      background-color: var(--logs-highlight-bg);
    }
  }
}

.snapshots :deep() .state-description{
  font-size: .8em;
  color: var(--error);
}

</style>
