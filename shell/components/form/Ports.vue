<script>
import debounce from 'lodash/debounce';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { removeAt } from '@shell/utils/array';
import { clone } from '@shell/utils/object';
import { Checkbox } from '@components/Form/Checkbox';

export default {
  components: { Checkbox },
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
  },

  created() {
    this.queueUpdate = debounce(this.update, 500);
  },

  /*
    Name string `json:"name,omitempty"`
    // Expose will make the port available outside the cluster. All http/https ports will be set to true by default
    // if Expose is nil.  All other protocols are set to false by default
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
        name:       '',
        expose:     true,
        protocol:   'HTTP',
        port:       null,
        targetPort: null,
        hostPort:   false
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
    <div class="spacer" />
    <div class="clearfix">
      <h4>Ports</h4>
    </div>

    <table
      v-if="rows.length"
      class="fixed"
    >
      <thead>
        <tr>
          <th
            v-if="padLeft"
            class="left"
          />
          <th class="port">
            Listening Port
          </th>
          <th class="protocol">
            Protocol
          </th>
          <th class="targetPort">
            Target Port
          </th>
          <th class="expose">
            Exposed
          </th>
          <th class="hostPort">
            Host Port
          </th>
          <th
            v-if="showRemove"
            class="remove"
          />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, idx) in rows"
          :key="idx"
        >
          <td
            v-if="padLeft"
            class="left"
          />
          <td class="port">
            <span v-if="isView">{{ row.port }}</span>
            <input
              v-else
              ref="port"
              v-model.number="row.port"
              type="number"
              min="1"
              max="65535"
              placeholder="e.g. 8080"
              @input="queueUpdate"
            >
          </td>
          <td class="protocol">
            <span v-if="isView">{{ row.protocol }}</span>
            <select
              v-else
              v-model="row.protocol"
              @input="queueUpdate"
            >
              <option value="HTTP">
                HTTP
              </option>
              <option value="HTTP2">
                HTTP/2
              </option>
              <option value="TCP">
                TCP
              </option>
              <option value="UDP">
                UDP
              </option>
              <option value="SCTP">
                SCTP
              </option>
              <option value="GRPC">
                GRPC
              </option>
            </select>
          </td>
          <td class="targetPort">
            <span v-if="isView">{{ row.targetPort }}</span>
            <input
              v-else
              v-model.number="row.targetPort"
              type="number"
              min="1"
              max="65535"
              placeholder="e.g. 80"
              @input="queueUpdate"
            >
          </td>
          <td class="expose">
            <span v-if="isView">{{ row.expose ? "Yes" : "No" }}</span>
            <Checkbox
              v-else
              v-model="row.expose"
              type="checkbox"
              @input="queueUpdate"
            />
          </td>
          <td class="hostPort">
            <span v-if="isView">{{ row.hostPort ? "Yes" : "No" }}</span>
            <Checkbox
              v-else
              v-model="row.hostPort"
              type="checkbox"
              @input="queueUpdate"
            />
          </td>
          <td
            v-if="showRemove"
            class="remove"
          >
            <button
              type="button"
              class="btn role-link"
              @click="remove(idx)"
            >
              Remove
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div
      v-if="showAdd"
      class="footer"
    >
      <button
        type="button"
        class="btn role-tertiary add"
        @click="add()"
      >
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

  .protocol {
    width: 100px;
  }

  .hostPort, .expose {
    width: #{$checkbox}px;
    text-align: center;
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
