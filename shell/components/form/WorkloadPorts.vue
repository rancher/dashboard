<script>
import { mapGetters } from 'vuex';
import debounce from 'lodash/debounce';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { removeAt, findBy } from '@shell/utils/array';
import { clone } from '@shell/utils/object';
import LabeledInput from '@shell/components/form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { HCI as HCI_LABELS_ANNOTATIONS } from '@shell/config/labels-annotations';
import { isHarvesterSatisfiesVersion } from '@shell/utils/cluster';
import { NAME as HARVESTER } from '@shell/config/product/harvester';
import { CAPI, SERVICE } from '@shell/config/types';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
  },

  props:      {
    value: {
      type:    Array,
      default: null,
    },

    mode: {
      type:    String,
      default: _EDIT,
    },

    // array of services auto-created previously (only relevent when mode !== create)
    services: {
      type:    Array,
      default: () => []
    },

    // workload name
    name: {
      type:    String,
      default: ''
    }
  },

  data() {
    const rows = clone(this.value || []).map((row) => {
      row._showHost = false;
      row._serviceType = row._serviceType || '';
      row._name = row.name ? `${ row.name }` : `${ row.containerPort }${ row.protocol.toLowerCase() }${ row.hostPort || row._listeningPort || '' }`;
      if (row.hostPort || row.hostIP) {
        row._showHost = true;
      }

      return row;
    });

    // show host port column if existing port data has any host ports defined
    const showHostPorts = !!rows.some(row => !!row.hostPort);

    return {
      rows,
      showHostPorts,
      workloadPortOptions: ['TCP', 'UDP']
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    canNotAccessService() {
      return !this.$store.getters['cluster/schemaFor'](SERVICE);
    },

    serviceTypeTooltip() {
      return this.canNotAccessService ? this.t('workload.container.noServiceAccess') : undefined;
    },

    isView() {
      return this.mode === _VIEW;
    },

    showAdd() {
      return !this.isView;
    },

    showRemove() {
      return !this.isView;
    },

    serviceTypes() {
      return [
        {
          label: this.t('workload.container.ports.noCreateService'),
          value: ''
        },
        {
          label: this.t('serviceTypes.clusterip'),
          value: 'ClusterIP'
        },
        {
          label: this.t('serviceTypes.nodeport'),
          value: 'NodePort'
        },
        {
          label: this.t('serviceTypes.loadbalancer'),
          value: 'LoadBalancer'
        },
      ];
    },

    clusterIPServicePorts() {
      return ((this.services.filter(svc => svc.spec.type === 'ClusterIP') || [])[0] || {})?.spec?.ports;
    },

    loadBalancerServicePorts() {
      return ((this.services.filter(svc => svc.spec.type === 'LoadBalancer') || [])[0] || {})?.spec?.ports;
    },

    nodePortServicePorts() {
      return ((this.services.filter(svc => svc.spec.type === 'NodePort') || [])[0] || {})?.spec?.ports;
    },

    ipamOptions() {
      return [{
        label: 'DHCP',
        value: 'dhcp',
      }, {
        label: 'Pool',
        value: 'pool',
      }];
    },

    ipamIndex() {
      return this.rows.findIndex(row => row._serviceType === 'LoadBalancer' && row.protocol === 'TCP');
    },

    serviceWithIpam() {
      return this.services.find(s => s?.metadata?.annotations[HCI_LABELS_ANNOTATIONS.CLOUD_PROVIDER_IPAM]);
    },

    showIpam() {
      let cloudProvider;
      const version = this.provisioningCluster?.kubernetesVersion;

      if (this.provisioningCluster?.isRke2) {
        const machineSelectorConfig = this.provisioningCluster?.spec?.rkeConfig?.machineSelectorConfig || {};
        const agentConfig = (machineSelectorConfig[0] || {}).config;

        cloudProvider = agentConfig?.['cloud-provider-name'];
      } else if (this.provisioningCluster?.isRke1) {
        const currentCluster = this.$store.getters['currentCluster'];

        cloudProvider = currentCluster?.spec?.rancherKubernetesEngineConfig?.cloudProvider?.name;
      }

      return cloudProvider === HARVESTER &&
              isHarvesterSatisfiesVersion(version);
    },

    provisioningCluster() {
      const out = this.$store.getters['management/all'](CAPI.RANCHER_CLUSTER).find(c => c?.status?.clusterName === this.currentCluster.metadata.name);

      return out;
    },
  },

  created() {
    this.queueUpdate = debounce(this.update, 500);
    this.rows.map((row) => {
      this.setServiceType(row);
      this.setIpam(row);
    });
  },

  methods: {
    add() {
      this.rows.push({
        name:          '',
        expose:        true,
        protocol:      'TCP',
        containerPort: null,
        hostPort:      null,
        hostIP:        null,
        _showHost:     false,
        _serviceType:  '',
        _ipam:         'dhcp',
      });

      this.queueUpdate();

      this.$nextTick(() => {
        const inputs = this.$refs.name;

        inputs[inputs.length - 1].focus();
      });
    },

    remove(idx) {
      removeAt(this.rows, idx);
      this.queueUpdate();
    },

    update() {
      if ( this.isView ) {
        return;
      }
      const out = [];

      for ( const row of this.rows ) {
        const value = clone(row);

        delete value._showHost;
        out.push(value);
      }
      this.$emit('input', out);
    },

    setServiceType(row) {
      const { _name } = row;

      if (this.loadBalancerServicePorts) {
        const portSpec = findBy(this.loadBalancerServicePorts, 'name', _name);

        if (portSpec) {
          this.$set(row, '_listeningPort', portSpec.port);

          row._serviceType = 'LoadBalancer';

          return;
        }
      } if (this.nodePortServicePorts) {
        const portSpec = findBy(this.nodePortServicePorts, 'name', _name);

        if (portSpec) {
          this.$set(row, '_listeningPort', portSpec.nodePort);

          row._serviceType = 'NodePort';

          return;
        }
      } if (this.clusterIPServicePorts) {
        if (findBy(this.clusterIPServicePorts, 'name', _name)) {
          row._serviceType = 'ClusterIP';

          return;
        }
      }

      return '';
    },

    setIpam(row) {
      if (this.serviceWithIpam && row._serviceType === 'LoadBalancer' && row.protocol === 'TCP') {
        row._ipam = this.serviceWithIpam?.metadata?.annotations[HCI_LABELS_ANNOTATIONS.CLOUD_PROVIDER_IPAM];
      }
    },
  },
};
</script>

<template>
  <div :style="{'width':'100%'}">
    <div
      v-for="(row, idx) in rows"
      :key="idx"
      class="ports-row"
      :class="{
        'show-host':row._showHost,
        'loadBalancer': row._serviceType === 'LoadBalancer',
        'tcp': row.protocol === 'TCP',
        'show-ipam': showIpam,
      }"
    >
      <div class="service-type col">
        <LabeledSelect
          v-model="row._serviceType"
          :mode="mode"
          :label="t('workload.container.ports.createService')"
          :options="serviceTypes"
          :disabled="canNotAccessService"
          :tooltip="serviceTypeTooltip"
          @input="queueUpdate"
        />
      </div>

      <div class="portName">
        <LabeledInput
          ref="name"
          v-model="row.name"
          :mode="mode"
          :label="t('workload.container.ports.name')"
          @input="queueUpdate"
        />
      </div>

      <div class="port">
        <LabeledInput
          v-model.number="row.containerPort"
          :mode="mode"
          type="number"
          min="1"
          max="65535"
          placeholder="e.g. 8080"
          :label="t('workload.container.ports.containerPort')"
          :required="row._serviceType === 'LoadBalancer' "
          @input="queueUpdate"
        />
      </div>

      <div class="protocol col">
        <LabeledSelect
          v-model="row.protocol"
          :mode="mode"
          :options="workloadPortOptions"
          :multiple="false"
          :label="t('workload.container.ports.protocol')"
          @input="queueUpdate"
        />
      </div>

      <div v-if="row._showHost" class="targetPort">
        <LabeledInput
          ref="port"
          v-model.number="row.hostPort"
          :mode="mode"
          type="number"
          min="1"
          max="65535"
          placeholder="e.g. 80"
          :label="t('workload.container.ports.hostPort')"
          @input="queueUpdate"
        />
      </div>

      <div v-if="row._showHost" class="hostip">
        <LabeledInput
          ref="port"
          v-model="row.hostIP"
          :mode="mode"
          placeholder="e.g. 1.1.1.1"
          :label="t('workload.container.ports.hostIP')"
          @input="queueUpdate"
        />
      </div>

      <div v-if="!row._showHost && row._serviceType !== 'LoadBalancer' && row._serviceType !== 'NodePort'" class="add-host">
        <button :disabled="mode==='view'" type="button" class="btn btn-sm role-tertiary" @click="row._showHost = true">
          {{ t('workloadPorts.addHost') }}
        </button>
      </div>

      <div v-if="row._serviceType === 'LoadBalancer' || row._serviceType === 'NodePort'">
        <LabeledInput
          ref="port"
          v-model.number="row._listeningPort"
          type="number"
          :mode="mode"
          :label="t('workload.container.ports.listeningPort')"
          :required="row._serviceType === 'LoadBalancer' "
          @input="queueUpdate"
        />
      </div>

      <div v-if="showIpam && row._serviceType === 'LoadBalancer' && row.protocol === 'TCP'">
        <div v-if="idx === ipamIndex">
          <LabeledSelect
            v-model="row._ipam"
            :mode="mode"
            :options="ipamOptions"
            :label="t('harvester.service.ipam.label')"
            :disabled="mode === 'edit'"
            @input="queueUpdate"
          />
        </div>
        <div v-else>
          <LabeledSelect
            v-model="rows[ipamIndex]._ipam"
            :mode="mode"
            :options="ipamOptions"
            :label="t('harvester.service.ipam.label')"
            :disabled="true"
            @input="queueUpdate"
          />
        </div>
      </div>

      <div v-if="showRemove" class="remove">
        <button type="button" class="btn role-link" @click="remove(idx)">
          {{ t('workloadPorts.remove') }}
        </button>
      </div>
    </div>
    <div v-if="showAdd" class="footer">
      <button type="button" class="btn role-tertiary add" @click="add()">
        {{ t('workloadPorts.addPort') }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$remove: 75;
$checkbox: 75;

.title {
  margin-bottom: 10px;

  .read-from-file {
    float: right;
  }
}
.ports-headers, .ports-row{
  display: grid;
  grid-template-columns: 20% 32% 145px 90px .5fr .5fr;
  grid-column-gap: $column-gutter;
  margin-bottom: 10px;
  align-items: center;
  & .port{
    display: flex;
    justify-content: space-between;
  }

  &.show-host{
    grid-template-columns: 20% 20% 145px 90px 140px .5fr .5fr;
  }

  &.show-ipam.loadBalancer.tcp{
    grid-template-columns: 20% 20% 145px 90px .5fr 140px .5fr;
  }

  &.show-ipam.show-host.loadBalancer{
    grid-template-columns: 20% 10% 135px 90px 105px .5fr .5fr .5fr;
  }

  &.show-ipam.show-host.loadBalancer.tcp{
    grid-template-columns: 12% 10% 135px 90px 105px .5fr .5fr 100px .5fr;
  }
}

.add-host {
  justify-self: center;
}

.protocol {
  height: 100%;
}

.ports-headers {
  color: var(--input-label);
}

.toggle-host-ports {
  color: var(--primary);
}

.remove BUTTON {
  padding: 0px;
}

.ports-row INPUT {
  height: 50px;
}

.footer {
  .protip {
    float: right;
    padding: 5px 0;
  }
}
.ports-row .protocol ::v-deep .unlabeled-select,
.ports-row .protocol ::v-deep .unlabeled-select .v-select {
  height: 100%;
}
.ports-row .protocol ::v-deep .unlabeled-select .vs__dropdown-toggle {
  padding-top: 12px;
}
</style>
