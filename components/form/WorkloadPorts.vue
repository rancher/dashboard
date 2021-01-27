<script>
import debounce from 'lodash/debounce';
import { _EDIT, _VIEW } from '@/config/query-params';
import { removeAt, findBy } from '@/utils/array';
import { clone } from '@/utils/object';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

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
      row._serviceType = '' ;
      row._name = row.name ? `${ row.name }` : `${ row.containerPort }${ row.protocol.toLowerCase() }${ row.hostPort || row._lbPort || '' }`;
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
    }
  },

  created() {
    this.queueUpdate = debounce(this.update, 500);
    this.rows.map((row) => {
      this.setServiceType(row);
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
          row._lbPort = portSpec.port;

          row._serviceType = 'LoadBalancer';

          return;
        }
      } if (this.nodePortServicePorts) {
        if (findBy(this.nodePortServicePorts, 'name', _name)) {
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
    }
  },
};
</script>

<template>
  <div :style="{'width':'100%'}">
    <div
      v-for="(row, idx) in rows"
      :key="idx"
      class="ports-row"
      :class="{'show-host':row._showHost}"
    >
      <div class="service-type">
        <LabeledSelect v-model="row._serviceType" :mode="mode" :label="t('workload.container.ports.createService')" :options="serviceTypes" />
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
          @input="queueUpdate"
        />
      </div>

      <div class="protocol">
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

      <div v-if="!row._showHost && row._serviceType !== 'LoadBalancer'" class="add-host">
        <button :disabled="mode==='view'" type="button" class="btn btn-sm role-tertiary" @click="row._showHost = true">
          {{ t('workloadPorts.addHost') }}
        </button>
      </div>

      <div v-if="row._serviceType === 'LoadBalancer'">
        <LabeledInput
          ref="port"
          v-model.number="row._lbPort"
          type="number"
          :mode="mode"
          :label="t('workload.container.ports.listeningPort')"
          required
          @input="queueUpdate"
        />
      </div>

      <div v-if="showRemove" class="remove">
        <button type="button" class="btn bg-transparent role-link" @click="remove(idx)">
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
  grid-template-columns: 20% 3fr 160px 80px 10% 58px;
  grid-column-gap: $column-gutter;
  margin-bottom: 10px;
  align-items: center;
  & .port{
    display: flex;
    justify-content: space-between;
  }

  &.show-host{
    grid-template-columns: 20% 3fr 160px 80px 160px 10% 1fr
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
