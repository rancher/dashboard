<script>
import debounce from 'lodash/debounce';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { removeAt } from '@shell/utils/array';
import { clone } from '@shell/utils/object';
import Select from '@shell/components/form/Select';
import Error from '@shell/components/form/Error';

export default {
  components: { Select, Error },
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
    },
    rules: {
      default:   () => [],
      type:      Array,
      // we only want functions in the rules array
      validator: rules => rules.every(rule => ['function'].includes(typeof rule))
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

    showProtocol() {
      return this.specType !== 'NodePort';
    },

    showNodePort() {
      return this.specType === 'NodePort' || this.specType === 'LoadBalancer';
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
      // don't focus on mount because we'll pull focus from name/namespace input
      this.add(false);
    }
  },

  methods: {
    add(focus = true) {
      this.rows.push({
        name:       '',
        port:       null,
        protocol:   'TCP',
        targetPort: null,
      });

      this.queueUpdate();

      if (this.rows.length > 0 && focus) {
        this.$nextTick(() => {
          const inputs = this.$refs['port-name'];

          inputs[inputs.length - 1].focus();
        });
      }
    },

    remove(idx) {
      removeAt(this.rows, idx);
      this.queueUpdate();
    },

    update() {
      if ( this.isView ) {
        return;
      }

      this.$emit('input', this.rows);
    }
  },
};
</script>

<template>
  <div>
    <div v-if="rows.length">
      <div
        class="ports-headers"
        :class="{'show-protocol':showProtocol, 'show-node-port':showNodePort}"
      >
        <span
          v-if="padLeft"
          class="left"
        />
        <span class="port-name">
          <t k="servicePorts.rules.name.label" />
        </span>
        <span class="port">
          <t k="servicePorts.rules.listening.label" />
          <span class="text-error">*</span>
        </span>
        <span
          v-if="showProtocol"
          class="port-protocol"
        >
          <t k="servicePorts.rules.protocol.label" />
        </span>
        <span class="target-port">
          <t k="servicePorts.rules.target.label" />
          <span class="text-error">*</span>

        </span>
        <span
          v-if="showNodePort"
          class="node-port"
        >
          <t k="servicePorts.rules.node.label" />
        </span>
        <span
          v-if="showRemove"
          class="remove"
        />
      </div>
      <div
        v-for="(row, idx) in rows"
        :key="idx"
        class="ports-row"
        :class="{'show-protocol':showProtocol, 'show-node-port':showNodePort}"
      >
        <div
          v-if="padLeft"
          class="left"
        />
        <div class="port-name">
          <span v-if="isView">{{ row.name }}</span>
          <input
            v-else
            ref="port-name"
            v-model.number="row.name"
            type="text"
            :placeholder="t('servicePorts.rules.name.placeholder')"
            @input="queueUpdate"
          >
        </div>
        <div class="port">
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
          >
        </div>
        <div
          v-if="showProtocol"
          class="port-protocol"
        >
          <span v-if="isView">{{ row.protocol }}</span>
          <Select
            v-else
            v-model="row.protocol"
            :options="protocolOptions"
            @input="queueUpdate"
          />
        </div>
        <div class="target-port">
          <span v-if="isView">{{ row.targetPort }}</span>
          <input
            v-else
            v-model="row.targetPort"
            :placeholder="t('servicePorts.rules.target.placeholder')"
            @input="queueUpdate"
          >
        </div>
        <div
          v-if="showNodePort"
          class="node-port"
        >
          <span v-if="isView">{{ row.nodePort }}</span>
          <input
            v-else
            v-model.number="row.nodePort"
            type="number"
            min="1"
            max="65535"
            :placeholder="t('servicePorts.rules.node.placeholder')"
            @input="queueUpdate"
          >
        </div>
        <div
          v-if="showRemove"
          class="remove"
        >
          <button
            type="button"
            class="btn role-link"
            @click="remove(idx)"
          >
            <t k="generic.remove" />
          </button>
        </div>
        <Error
          :value="{...row, idx}"
          :rules="rules"
        />
      </div>
    </div>
    <div
      v-if="showAdd"
      class="footer"
    >
      <button
        type="button"
        class="btn role-tertiary add"
        @click="add()"
      >
        <t k="generic.add" />
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
    grid-column-gap: $column-gutter;
    margin-bottom: 10px;
    align-items: center;

    &.show-protocol{
      grid-template-columns: 23% 23% 10% 15% 15% 10%;
      &:not(.show-node-port){
        grid-template-columns: 31% 31% 10% 15% 10%;
      }
    }
    &.show-node-port:not(.show-protocol){
      grid-template-columns: 28% 28% 15% 15% 10%;
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

  .ports-row {
    > div {
      height: 100%;
    }

    .port-protocol ::v-deep {
      .unlabeled-select {
        .v-select.inline {
          margin-top: 2px;
        }
      }
    }
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
