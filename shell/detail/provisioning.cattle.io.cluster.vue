<script>
import Loading from '@shell/components/Loading';
import Banner from '@shell/components/Banner';
import ResourceTable from '@shell/components/ResourceTable';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import SortableTable from '@shell/components/SortableTable';
import CopyCode from '@shell/components/CopyCode';
import Tab from '@shell/components/Tabbed/Tab';
import { allHash } from '@shell/utils/promise';
import { CAPI, MANAGEMENT, NORMAN, SNAPSHOT } from '@shell/config/types';
import {
  STATE, NAME as NAME_COL, AGE, AGE_NORMAN, STATE_NORMAN, ROLES, MACHINE_NODE_OS, MANAGEMENT_NODE_OS
} from '@shell/config/table-headers';
import CustomCommand from '@shell/edit/provisioning.cattle.io.cluster/CustomCommand';
import AsyncButton from '@shell/components/AsyncButton.vue';
import AnsiUp from 'ansi_up';
import day from 'dayjs';
import { addParams } from '@shell/utils/url';
import { base64Decode } from '@shell/utils/crypto';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';

import Socket, {
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR
} from '@shell/utils/socket';

let lastId = 1;
const ansiup = new AnsiUp();

export default {
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
    const fetchOne = {};

    if ( this.$store.getters['management/canList'](CAPI.MACHINE_DEPLOYMENT) ) {
      fetchOne.machineDeployments = this.$store.dispatch('management/findAll', { type: CAPI.MACHINE_DEPLOYMENT });
    }

    if ( this.$store.getters['management/canList'](CAPI.MACHINE) ) {
      fetchOne.machines = this.$store.dispatch('management/findAll', { type: CAPI.MACHINE });
    }

    if ( this.$store.getters['management/canList'](SNAPSHOT) ) {
      fetchOne.machines = this.$store.dispatch('management/findAll', { type: SNAPSHOT });
    }

    if (this.value.isImported || this.value.isCustom) {
      fetchOne.clusterToken = this.value.getOrCreateToken();
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
  },

  created() {
    if ( this.showLog ) {
      this.connectLog();
    }
  },

  beforeDestroy() {
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

      mgmtNodeSchema: this.$store.getters[`management/schemaFor`](MANAGEMENT.NODE),
      machineSchema:  this.$store.getters[`management/schemaFor`](CAPI.MACHINE),

      clusterToken: null,
      etcdBackups:  null,

      logOpen:   false,
      logSocket: null,
      logs:      [],
    };
  },

  watch: {
    showNodes(neu) {
      if (neu) {
        this.$store.dispatch('rancher/findAll', { type: NORMAN.NODE });
      }
    }
  },

  computed: {
    defaultTab() {
      if (this.showRegistration && !this.machines?.length) {
        return 'registration';
      }

      if (this.showMachines) {
        return 'machine-pools';
      }

      if (this.showNodes) {
        return 'node-pools';
      }

      return '';
    },

    fakeMachines() {
      // When a deployment has no machines it's not shown.... so add a fake machine to it
      // This is a catch all scenario seen in older node pool world but not deployments
      const emptyDeployments = this.allMachineDeployments.filter(x => x.spec.clusterName === this.value.metadata.name && x.spec.replicas === 0);

      return emptyDeployments.map(d => ({
        poolId:       d.id,
        mainRowKey: 'isFake',
        pool:       d,
      }));
    },

    machines() {
      return [...this.value.machines, ...this.fakeMachines];
    },

    nodes() {
      const nodes = this.allNodes.filter(x => x.mgmtClusterId === this.value.mgmtClusterId);

      return [...nodes, ...this.fakeNodes];
    },

    fakeNodes() {
      // When a pool has no nodes it's not shown.... so add a fake node to it
      const emptyNodePools = this.allNodePools.filter(x => x.spec.clusterName === this.value.mgmtClusterId && x.spec.quantity === 0);

      return emptyNodePools.map(np => ({
        spec:       { nodePoolName: np.id.replace('/', ':') },
        mainRowKey: 'isFake',
        pool:       np,
      }));
    },

    showMachines() {
      return this.haveMachines && (this.value.isRke2 || !!this.machines.length);
    },

    showNodes() {
      return !this.showMachines && this.haveNodes && !!this.nodes.length;
    },

    showSnapshots() {
      return this.value.isRke2 || this.value.isRke1;
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
          formatterOpts: { reference: 'kubeNodeDetailLocation' }
        },
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
          formatterOpts: { reference: 'kubeNodeDetailLocation' }
        },
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

      return (this.etcdBackups || []).filter(x => x.clusterId === mgmtId);
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
        STATE_NORMAN,
        {
          name:          'name',
          labelKey:      'tableHeaders.name',
          value:         'nameDisplay',
          sort:          ['nameSort'],
          canBeVariable: true,
        },
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

      if ( this.value.isImported ) {
        return !this.value.mgmt?.isReady;
      }

      if ( this.value.isCustom ) {
        return true;
      }

      return false;
    },

    isClusterReady() {
      return this.value.mgmt?.isReady;
    },

    showLog() {
      return this.value.mgmt?.hasLink('log');
    },

    dateTimeFormatStr() {
      const dateFormat = escapeHtml( this.$store.getters['prefs/get'](DATE_FORMAT));

      return `${ dateFormat } ${ this.timeFormatStr }`;
    },

    timeFormatStr() {
      return escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));
    }
  },

  mounted() {
    window.c = this;
  },

  methods: {
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
    <Banner v-if="$fetchState.error" color="error" :label="$fetchState.error" />
    <ResourceTabs v-model="value" :default-tab="defaultTab">
      <Tab v-if="showMachines" name="machine-pools" :label-key="value.isCustom ? 'cluster.tabs.machines' : 'cluster.tabs.machinePools'" :weight="4">
        <ResourceTable
          :rows="machines"
          :schema="machineSchema"
          :headers="machineHeaders"
          default-sort-by="name"
          :groupable="false"
          :group-by="value.isCustom ? null : 'poolId'"
          group-ref="pool"
          :group-sort="['pool.nameDisplay']"
        >
          <template #main-row:isFake="{fullColspan}">
            <tr class="main-row">
              <td :colspan="fullColspan" class="no-entries">
                {{ t('node.list.noNodes') }}
              </td>
            </tr>
          </template>

          <template #group-by="{group}">
            <div class="pool-row" :class="{'has-description':group.ref && group.ref.template}">
              <div v-trim-whitespace class="group-tab">
                <div v-if="group && group.ref" v-html="group.ref.groupByPoolShortLabel" />
                <div v-else v-html="t('resourceTable.groupLabel.notInANodePool')">
                </div>
                <div v-if="group.ref && group.ref.template" class="description text-muted text-small">
                  {{ group.ref.providerDisplay }} &ndash;  {{ group.ref.providerLocation }} / {{ group.ref.providerSize }} ({{ group.ref.providerName }})
                </div>
              </div>
              <div v-if="group.ref" class="right mr-45">
                <template v-if="value.hasLink('update')">
                  <button v-tooltip="t('node.list.scaleDown')" :disabled="group.ref.spec.replicas < 2" type="button" class="btn btn-sm role-secondary" @click="group.ref.scalePool(-1)">
                    <i class="icon icon-sm icon-minus" />
                  </button>
                  <button v-tooltip="t('node.list.scaleUp')" type="button" class="btn btn-sm role-secondary ml-10" @click="group.ref.scalePool(1)">
                    <i class="icon icon-sm icon-plus" />
                  </button>
                </template>
              </div>
            </div>
          </template>
        </ResourceTable>
      </Tab>
      <Tab v-else-if="showNodes" name="node-pools" :label-key="value.isCustom ? 'cluster.tabs.machines' : 'cluster.tabs.machinePools'" :weight="4">
        <ResourceTable
          :schema="mgmtNodeSchema"
          :headers="mgmtNodeSchemaHeaders"
          :rows="nodes"
          :groupable="false"
          :group-by="value.isCustom ? null : 'spec.nodePoolName'"
          group-ref="pool"
          :group-sort="['pool.nameDisplay']"
        >
          <template #main-row:isFake="{fullColspan}">
            <tr class="main-row">
              <td :colspan="fullColspan" class="no-entries">
                {{ t('node.list.noNodes') }}
              </td>
            </tr>
          </template>

          <template #group-by="{group}">
            <div class="pool-row" :class="{'has-description':group.ref && group.ref.nodeTemplate}">
              <div v-trim-whitespace class="group-tab">
                <div v-if="group.ref" v-html="t('resourceTable.groupLabel.nodePool', { name: group.ref.spec.hostnamePrefix, count: group.ref.scale}, true)">
                </div>
                <div v-else v-html="t('resourceTable.groupLabel.notInANodePool')">
                </div>
                <div v-if="group.ref && group.ref.nodeTemplate" class="description text-muted text-small">
                  {{ group.ref.providerDisplay }} &ndash;  {{ group.ref.providerLocation }} / {{ group.ref.providerSize }} ({{ group.ref.providerName }})
                </div>
              </div>
              <div v-if="group.ref" class="right">
                <template v-if="group.ref.hasLink('update')">
                  <button v-tooltip="t('node.list.scaleDown')" :disabled="group.ref.spec.quantity < 2" type="button" class="btn btn-sm role-secondary" @click="group.ref.scalePool(-1)">
                    <i class="icon icon-sm icon-minus" />
                  </button>
                  <button v-tooltip="t('node.list.scaleUp')" type="button" class="btn btn-sm role-secondary ml-10" @click="group.ref.scalePool(1)">
                    <i class="icon icon-sm icon-plus" />
                  </button>
                </template>

                <button type="button" class="project-action btn btn-sm role-multi-action actions mr-5 ml-15" :class="{invisible: !showPoolActionButton(group.ref)}" @click="showPoolAction($event, group.ref)">
                  <i class="icon icon-actions" />
                </button>
              </div>
            </div>
          </template>
        </ResourceTable>
      </Tab>

      <Tab v-if="showLog" name="log" :label="t('cluster.tabs.log')" :weight="3" class="logs-container">
        <table class="fixed" cellpadding="0" cellspacing="0">
          <tbody class="logs-body">
            <template v-if="logs.length">
              <tr v-for="line in logs" :key="line.id">
                <td :key="line.id + '-time'" class="time" v-html="format(line.time)" />
                <td :key="line.id + '-msg'" class="msg" v-html="line.msg" />
              </tr>
            </template>
            <tr v-else-if="!logOpen" v-t="'cluster.log.connecting'" colspan="2" class="msg text-muted" />
            <tr v-else v-t="'cluster.log.noData'" colspan="2" class="msg text-muted" />
          </tbody>
        </table>
      </Tab>

      <Tab v-if="showRegistration" name="registration" :label="t('cluster.tabs.registration')" :weight="2">
        <CustomCommand v-if="value.isCustom" :cluster-token="clusterToken" :cluster="value" />
        <template v-else>
          <h4 v-html="t('cluster.import.commandInstructions', null, true)" />
          <CopyCode class="m-10 p-10">
            {{ clusterToken.command }}
          </CopyCode>

          <h4 class="mt-10" v-html="t('cluster.import.commandInstructionsInsecure', null, true)" />
          <CopyCode class="m-10 p-10">
            {{ clusterToken.insecureCommand }}
          </CopyCode>

          <h4 class="mt-10" v-html="t('cluster.import.clusterRoleBindingInstructions', null, true)" />
          <CopyCode class="m-10 p-10">
            {{ t('cluster.import.clusterRoleBindingCommand', null, true) }}
          </CopyCode>
        </template>
      </Tab>

      <Tab v-if="showSnapshots" name="snapshots" label="Snapshots" :weight="1">
        <SortableTable
          :headers="value.isRke1 ? rke1SnapshotHeaders : rke2SnapshotHeaders"
          default-sort-by="age"
          :table-actions="value.isRke1"
          :rows="value.isRke1 ? rke1Snapshots : rke2Snapshots"
          :search="false"
        >
          <template #header-right>
            <AsyncButton
              mode="snapshot"
              class="btn role-primary"
              :disabled="!isClusterReady"
              @click="takeSnapshot"
            />
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
</style>
