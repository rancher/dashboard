<script>
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import CopyCode from '@shell/components/CopyCode';
import Tab from '@shell/components/Tabbed/Tab';
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
import { isAlternate } from '@shell/utils/platform';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import SortableTable from '@shell/components/ResourceTable';
import { PaginationParamFilter, FilterArgs } from '@shell/types/store/pagination.types';
import { hasAccessToLocalCluster } from '@shell/utils/cluster';

let lastId = 1;
const ansiup = new AnsiUp();

export default {
  emits: ['input'],

  components: {
    Loading,
    Banner,
    PaginatedResourceTable,
    SortableTable,
    ResourceTabs,
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

    const promises = {};

    if ( this.value.isImported || this.value.isCustom || this.value.isHostedKubernetesProvider ) {
      promises.clusterToken = this.value.getOrCreateToken();
    }

    // Does the user have access to the local cluster? Need to in order to be able to show the 'Related Resources' tab
    promises.hasLocalAccess = hasAccessToLocalCluster(this.$store);

    if ( this.value.isRke1 && this.$store.getters['isRancher'] ) {
      promises.rke1Snapshots = this.$store.dispatch('rancher/findAll', { type: NORMAN.ETCD_BACKUP });
      promises.rke1Nodes = this.$store.dispatch('rancher/findAll', { type: NORMAN.NODE_POOL });
    }

    this.loadNodeTemplateForMasthead();

    this.clusterToken = await promises.clusterToken;
    this.hasLocalAccess = await promises.hasLocalAccess;
    this.rke1Snapshots = await promises.rke1Snapshots;
    this.rke1Nodes = await promises.rke1Nodes;
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

    this.$store.dispatch('management/forgetType', CAPI.MACHINE);
    this.$store.dispatch('management/forgetType', MANAGEMENT.NODE);
    this.$store.dispatch('management/forgetType', MANAGEMENT.NODE_TEMPLATE);
  },

  data() {
    return {
      hasLocalAccess: false,

      mgmtNodeSchema:     this.$store.getters[`management/schemaFor`](MANAGEMENT.NODE),
      machineSchema:      this.$store.getters[`management/schemaFor`](CAPI.MACHINE),
      rke1Snapshots:      [],
      rke1Nodes:          [],
      rke2SnapshotSchema: this.$store.getters[`management/schemaFor`](SNAPSHOT),

      clusterToken: null,

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

  computed: {
    machinePools() {
      return this.$store.getters['management/all'](CAPI.MACHINE);
    },

    machineNodes() {
      return this.$store.getters['management/all'](MANAGEMENT.NODE);
    },

    defaultTab() {
      if (this.showRegistration) {
        if (!this.machinePools?.length && !this.machineNodes?.length) {
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

    showMachines() {
      const showMachines = this.machinePools.length && (this.value.isRke2 || !!this.machines.length);

      return showMachines && this.extDetailTabs.machines;
    },

    showNodes() {
      return !this.showMachines && !!this.machineNodes;
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
    // To display the provider and kubernetes in the masthead of this page we need to retrieve the appropriate node templates so they models can find the data
    loadNodeTemplateForMasthead() {
      if (this.$store.getters['management/canList'](MANAGEMENT.NODE_TEMPLATE)) {
        const args = { id: MANAGEMENT.NODE_TEMPLATE, context: 'provisioning.cattle.io.cluster' };

        if (this.$store.getters[`management/paginationEnabled`]?.(args)) {
          const templateOpt = PaginationParamFilter.createMultipleFields([{
            field: 'spec.clusterName',
            value: this.value.metadata.name,
            exact: true,
          }]);

          this.$store.dispatch(`management/findPage`, {
            type: MANAGEMENT.NODE_TEMPLATE,
            opt:  {
              force:      true,
              pagination: new FilterArgs({ filters: templateOpt })
            }
          });
        } else {
          this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
        }
      }
    },

    snapshotApiFilter(pagination) {
      if (!pagination.filters) {
        pagination.filters = [];
      }

      const required = PaginationParamFilter.createSingleField({
        field: 'spec.clusterName',
        exact: true,
        value: this.value.metadata.name,
      });

      pagination.filters.push(required);

      return pagination;
    },

    snapshotLocalFilter(rows) {
      return rows.filter((r) => r.spec.clusterName === this.value.metadata.name);
    },

    machinePoolApiFilter(pagination) {
      if (!pagination.filters) {
        pagination.filters = [];
      }

      const required = PaginationParamFilter.createSingleField({
        field: 'spec.clusterName',
        exact: true,
        value: this.value.metadata.name,
      });

      pagination.filters.push(required);

      return pagination;
    },

    machinePoolLocalFilter(rows) {
      return rows.filter((r) => r.spec.clusterName === this.value.metadata.name);
    },

    nodePoolApiFilter(pagination) {
      if (!pagination.filters) {
        pagination.filters = [];
      }

      const required = PaginationParamFilter.createSingleField({
        field: 'spec.clusterName',
        exact: true,
        value: this.value.metadata.name,
      });

      pagination.filters.push(required);

      return pagination;
    },

    nodePoolLocalFilter(rows) {
      return rows.filter((r) => r.spec.clusterName === this.value.metadata.name || r.id.includes(this.value.metadata.name));
    },

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
        <PaginatedResourceTable
          :schema="machineSchema"
          :headers="machineHeaders"
          default-sort-by="name"
          :groupable="false"
          :group-by="value.isCustom ? null : 'poolId'"
          group-ref="pool"
          :group-sort="['pool.nameDisplay']"
          :api-filter="machinePoolApiFilter"
          :local-filter="machinePoolLocalFilter"
          context="provisioning.cattle.io.cluster"
        >
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
        </PaginatedResourceTable>
      </Tab>

      <Tab
        v-else-if="showNodes"
        name="node-pools"
        :label-key="value.isCustom ? 'cluster.tabs.machines' : 'cluster.tabs.machinePools'"
        :weight="4"
      >
        <PaginatedResourceTable
          :schema="mgmtNodeSchema"
          :headers="mgmtNodeSchemaHeaders"
          :groupable="false"
          :group-by="value.isCustom ? null : 'spec.nodePoolName'"
          group-ref="pool"
          :group-sort="['pool.nameDisplay']"
          :api-filter="nodePoolApiFilter"
          :local-filter="nodePoolLocalFilter"
          context="provisioning.cattle.io.cluster"
        >
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
        </PaginatedResourceTable>
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
          v-if="value.isRke1"
          class="snapshots"
          :data-testid="'cluster-snapshots-list'"
          :headers="rke1SnapshotHeaders"
          default-sort-by="age"
          :table-actions="value.isRke1"
          :rows="rke1Snapshots"
          :search="false"
          :groupable="true"
          :group-by="snapshotsGroupBy"
        >
          <!-- Removing the group by namespace/list buttons in the middle header -->
          <template #header-middle />
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
        <PaginatedResourceTable
          v-else
          class="snapshots"
          :data-testid="'cluster-snapshots-list'"
          :schema="rke2SnapshotSchema"
          :headers="rke2SnapshotHeaders"
          default-sort-by="age"
          :table-actions="value.isRke1"
          :search="false"
          :namespaces="false"
          :group-by="snapshotsGroupBy"
          :api-filter="snapshotApiFilter"
          :local-filter="snapshotLocalFilter"
          context="provisioning.cattle.io.cluster"
        >
          <!-- Removing the group by namespace/list buttons in the middle header -->
          <template #header-middle />
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
        </PaginatedResourceTable>
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
