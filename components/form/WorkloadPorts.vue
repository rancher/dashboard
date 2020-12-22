<script>
import debounce from 'lodash/debounce';
import { _EDIT, _VIEW } from '@/config/query-params';
import { removeAt } from '@/utils/array';
import { clone } from '@/utils/object';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Checkbox from '@/components/form/Checkbox';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
    Checkbox
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

    createService: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    const rows = clone(this.value || []).map((row) => {
      row._showHost = false;
      if (row.hostPort || row.hostIP) {
        row._showHost = true;
      }

      return row;
    });

    // show host port column if existing port data has any host ports defined
    const showHostPorts = !!rows.filter(row => !!row.hostPort).length;

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
  },

  created() {
    this.queueUpdate = debounce(this.update, 500);
  },

  /*
    Name string `json:"name,omitempty"`
     Expose will make the port available outside the cluster. All http/https ports will be set to true by default
     if Expose is nil.  All other protocols are set to false by default
    Expose     *bool    `json:"expose,omitempty"`
    Protocol   Protocol `json:"protocol,omitempty"`
    Port       int32    `json:"port"`
    TargetPort int32    `json:"targetPort,omitempty"`
    HostPort   bool     `json:"hostport,omitempty"`

    [port]/[proto] -> [targetPort] [hostPort] [expose] [name]
  */

  methods: {
    add() {
      this.rows.push({
        name:          '',
        expose:        true,
        protocol:      'TCP',
        containerPort: null,
        hostPort:      null,
        hostIP:        null,
        _showHost:     false
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

      <div v-if="!row._showHost" class="add-host">
        <button type="button" class="btn btn-sm role-tertiary" @click="row._showHost = true">
          {{ t('workloadPorts.addHost') }}
        </button>
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
      <Checkbox v-model="createService" label="Create a service to expose ports" @input="$emit('update:create-service', $event)" />
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
// 1 unit is 8%
.ports-headers, .ports-row{
  display: grid;
  grid-template-columns: 30% 30% 18% 10% 5%;
  grid-column-gap: $column-gutter;
  margin-bottom: 10px;
  align-items: center;
  & .port{
    display: flex;
    justify-content: space-between;
  }

  &.show-host{
    grid-template-columns: 30% 16% 10% 15% 15% 5%;
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
