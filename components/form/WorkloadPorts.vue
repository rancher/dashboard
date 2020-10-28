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
        hostPort:      null
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

        if ( value.containerPort ) {
          out.push(value);
        }
      }
      this.$emit('input', out);
    }
  },
};
</script>

<template>
  <div :style="{'width':'100%'}">
    <div v-if="rows.length || isView">
      <div class="ports-headers" :class="{'show-host':showHostPorts}">
        <span v-if="padLeft" class="left"></span>
        <span class="portName">
          <t k="workload.container.ports.name" />
        </span>
        <span class="port">
          <t k="workload.container.ports.containerPort" />
          <span v-if="!isView" class="toggle-host-ports hand" @click="()=>showHostPorts=!showHostPorts">{{ showHostPorts ? 'Hide Host Ports' : 'Show Host Ports' }}</span>
        </span>
        <span v-if="showHostPorts" class="targetPort">
          <t k="workload.container.ports.hostPort" />
        </span>
        <span class="protocol">
          <t k="workload.container.ports.protocol" />
        </span>
        <span v-if="showRemove" class="remove"></span>
      </div>
      <div v-if="isView && !rows.length" class="ports-row">
        <span class="text-muted"> &mdash;</span>
        <span class="text-muted"> &mdash;</span>
        <span class="text-muted"> &mdash;</span>
      </div>
      <div
        v-for="(row, idx) in rows"
        :key="idx"
        class="ports-row"
        :class="{'show-host':showHostPorts}"
      >
        <div v-if="padLeft" class="left"></div>
        <div class="portName">
          <span v-if="isView && row.name">{{ row.name }}</span>
          <span v-else-if="isView" class="text-muted">&mdash;</span>
          <input
            v-else
            ref="name"
            v-model="row.name"
            @input="queueUpdate"
          />
        </div>
        <div class="port">
          <span v-if="isView && row.containerPort">{{ row.containerPort }}</span>
          <span v-else-if="isView" class="text-muted">&mdash;</span>
          <input
            v-else
            v-model.number="row.containerPort"
            type="number"
            min="1"
            max="65535"
            placeholder="e.g. 8080"
            @input="queueUpdate"
          />
        </div>
        <div v-if="showHostPorts" class="targetPort">
          <span v-if="isView && row.hostPort">{{ row.hostPort }}</span>
          <span v-else-if="isView" class="text-muted">&mdash;</span>
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
        </div>
        <div class="protocol">
          <span v-if="isView && row.protocol">{{ row.protocol }}</span>
          <span v-else-if="isView" class="text-muted">&mdash;</span>
          <v-select
            v-else
            v-model="row.protocol"
            :style="{'height':'50px'}"
            class="inline"
            :options="['TCP', 'UDP']"
            :multiple="false"
            @input="queueUpdate"
          />
        </div>
        <div v-if="showRemove" class="remove">
          <button type="button" class="btn bg-transparent role-link" @click="remove(idx)">
            Remove
          </button>
        </div>
      </div>
    </div>
    <div v-if="showAdd" class="footer">
      <button type="button" class="btn role-tertiary add" @click="add()">
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

  .ports-headers, .ports-row{
    display: grid;
    grid-template-columns: 38.87% 38.87% 10% 10%;
    grid-column-gap: $column-gutter;
    margin-bottom: 10px;
    align-items: center;
    & .port{
      display: flex;
      justify-content: space-between;
    }

    &.show-host{
      grid-template-columns: 33% 33% 10% 10% 10%;
    }
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
</style>
