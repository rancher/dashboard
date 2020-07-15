<script>
import debounce from 'lodash/debounce';
import { _EDIT, _VIEW } from '@/config/query-params';
import { removeAt } from '@/utils/array';
import { clone } from '@/utils/object';

export default {
  props:      {
    value: {
      type:    Array,
      default: null,
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
    padLeft: {
      type:    Boolean,
      default: false,
    }
  },

  data() {
    const rows = clone(this.value || []);

    // show host port column if existing port data has any host ports defined
    const showHostPorts = !!rows.filter(row => !!row.hostPort).length;

    return { rows, showHostPorts };
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
        hostPort:      false
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

        if ( value.hostPort ) {
          out.push(value);
        }
      }
      this.$emit('input', out);
    }
  },
};
</script>

<template>
  <div>
    <table v-if="rows.length" class="fixed">
      <thead>
        <tr>
          <th v-if="padLeft" class="left"></th>
          <th class="portName">
            <t k="workload.container.ports.name" />
          </th>
          <th class="port">
            <t k="workload.container.ports.containerPort" />
            <span v-if="!isView" class="toggle-host-ports" @click="()=>showHostPorts=!showHostPorts">{{ showHostPorts ? 'Hide Host Ports' : 'Show Host Ports' }}</span>
          </th>
          <th v-if="showHostPorts" class="targetPort">
            <t k="workload.container.ports.hostPort" />
          </th>
          <th class="protocol">
            <t k="workload.container.ports.protocol" />
          </th>
          <th v-if="showRemove" class="remove"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, idx) in rows"
          :key="idx"
        >
          <td v-if="padLeft" class="left"></td>
          <td class="portName">
            <span v-if="isView">{{ row.name }}</span>
            <input
              v-else
              ref="name"
              v-model="row.name"
              @input="queueUpdate"
            />
          </td>
          <td class="port">
            <span v-if="isView">{{ row.containerPort }}</span>
            <input
              v-else
              v-model.number="row.containerPort"
              type="number"
              min="1"
              max="65535"
              placeholder="e.g. 8080"
              @input="queueUpdate"
            />
          </td>
          <td v-if="showHostPorts" class="targetPort">
            <span v-if="isView">{{ row.hostPort }}</span>
            <input
              v-else
              ref="port"
              v-model.number="row.hostPort"
              type="number"
              min="1"
              max="65535"
              placeholder="e.g. 80"
              @input="queueUpdate"
            />
          </td>
          <td class="protocol">
            <span v-if="isView">{{ row.protocol }}</span>
            <v-select
              v-else
              v-model="row.protocol"
              :style="{'height':'50px'}"
              class="inline"
              :options="['TCP', 'UDP', 'SCTP']"
              :searchable="false"
              @input="queueUpdate"
            />
          </td>
          <td v-if="showRemove" class="remove">
            <button type="button" class="btn bg-transparent role-link" @click="remove(idx)">
              Remove
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="showAdd" class="footer">
      <button type="button" class="btn role-tertiary add mt-10" @click="add()">
        Add Port
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

  TABLE {
    width: 100%;
        border-collapse: separate;
    border-spacing: 5px 10px;
  }

  TH {
    text-align: left;
    font-size: 12px;
    font-weight: normal;
    color: var(--input-label);

    &.port {
      display: flex;
      justify-content: space-between;

      & .toggle-host-ports{
        padding-right: 5px;
        color: var(--primary)
      }
    }
  }

   TD {
    padding-bottom: 10px;
  }

  .left {
    width: #{$remove}px;
  }

  .protocol {
    width: 100px;
  }

  .hostPort, .expose {
    width: #{$checkbox}px;
    text-align: center;
  }

  .targetPort{
    width: 100px;
  }

  .value {
    vertical-align: top;
  }

  .remove {
    vertical-align: middle;
    text-align: right;
    width: #{$remove}px;
  }

  .footer {
    margin-top: 10px;
    margin-left: 5px;

    .protip {
      float: right;
      padding: 5px 0;
    }
  }
</style>
