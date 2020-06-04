<script>
import { debounce } from 'lodash';
import { _EDIT, _VIEW } from '@/config/query-params';
import { removeAt } from '@/utils/array';
import { clone } from '@/utils/object';

export default {
  components: {},
  props:      {
    value: {
      type:    Array,
      default: null,
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
    specType: {
      type:    String,
      default: 'ClusterIP',
    },
    padLeft: {
      type:    Boolean,
      default: false,
    },
    autoAddIfEmpty: {
      type:    Boolean,
      default: true,
    }
  },

  data() {
    const rows = clone(this.value || []);

    return { rows };
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

    protocolOptions() {
      return ['TCP', 'UDP'];
    },
  },

  created() {
    this.queueUpdate = debounce(this.update, 500);
  },

  mounted() {
    if ( this.isView ) {
      return;
    }

    if (this.autoAddIfEmpty && this.mode !== _EDIT && this?.rows.length < 1) {
      this.add();
    }
  },

  methods: {
    add() {
      this.rows.push({
        hostPort:   false,
        name:       '',
        port:       null,
        protocol:   'TCP',
        targetPort: null,
      });

      this.queueUpdate();

      this.$nextTick(() => {
        const inputs = this.$refs.port;

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

        if ( value.port ) {
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
    <div class="clearfix">
      <h4>
        <t k="servicePorts.header.label" />
      </h4>
    </div>

    <table v-if="rows.length" class="fixed">
      <thead>
        <tr>
          <th v-if="padLeft" class="left"></th>
          <th class="port-name">
            <t k="servicePorts.rules.name.label" />
          </th>
          <th class="port">
            <t k="servicePorts.rules.listening.label" />
          </th>
          <th v-if="specType !== 'NodePort'" class="port-protocol">
            <t k="servicePorts.rules.protocol.label" />
          </th>
          <th v-if="specType !== 'Headless'" class="target-port">
            <t k="servicePorts.rules.target.label" />
          </th>
          <th v-if="specType === 'NodePort' || specType === 'LoadBalancer'" class="node-port">
            <t k="servicePorts.rules.node.label" />
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
          <td class="port-name">
            <span v-if="isView">{{ row.name }}</span>
            <input
              v-else
              ref="port-name"
              v-model.number="row.name"
              type="text"
              :placeholder="t('servicePorts.rules.name.placeholder')"
              @input="queueUpdate"
            />
          </td>
          <td class="port">
            <span v-if="isView">{{ row.port }}</span>
            <input
              v-else
              ref="port"
              v-model.number="row.port"
              type="number"
              min="1"
              max="65535"
              :placeholder="t('servicePorts.rules.listening.placeholder')"
              @input="queueUpdate"
            />
          </td>
          <td v-if="specType !== 'NodePort'" class="port-protocol">
            <span v-if="isView">{{ row.protocol }}</span>
            <v-select
              v-else
              v-model="row.protocol"
              class="inline protocol-select"
              :searchable="false"
              :options="protocolOptions"
              @input="queueUpdate"
            />
          </td>
          <td v-if="specType !== 'Headless'" class="target-port">
            <span v-if="isView">{{ row.targetPort }}</span>
            <input
              v-else
              v-model.number="row.targetPort"
              type="number"
              min="1"
              max="65535"
              :placeholder="t('servicePorts.rules.target.placeholder')"
              @input="queueUpdate"
            />
          </td>
          <td v-if="specType === 'NodePort' || specType === 'LoadBalancer'" class="node-port">
            <span v-if="isView">{{ row.nodePort }}</span>
            <input
              v-else
              v-model.number="row.nodePort"
              type="number"
              min="1"
              max="65535"
              :placeholder="t('servicePorts.rules.node.placeholder')"
              @input="queueUpdate"
            />
          </td>
          <td v-if="showRemove" class="remove">
            <button type="button" class="btn bg-transparent role-link" @click="remove(idx)">
              <t k="buttons.remove" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="showAdd" class="footer">
      <button type="button" class="btn role-tertiary add" @click="add()">
        <t k="buttons.add" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $remove: 75;

  .title {
    margin-bottom: 10px;

    .read-from-file {
      float: right;
    }
  }

  TABLE {
    width: 100%;
  }

  TH {
    text-align: left;
    font-size: 12px;
    font-weight: normal;
    color: var(--input-label);
  }

  .left {
    width: #{$remove}px;
  }

  .port-protocol {
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

    .protip {
      float: right;
      padding: 5px 0;
    }
  }
</style>
