<script>
import { _EDIT, _VIEW } from '@/config/query-params';
import { clone } from '@/utils/object';
import UnitInput from '@/components/form/UnitInput';
import LabeledInput from '@/components/form/LabeledInput';
import ShellInput from '@/components/form/ShellInput';
import KeyValue from '@/components/form/KeyValue';

const KIND_LABELS = {
  'none':  'None',
  'http':  'HTTP request returns a successful status (200-399)',
  'https': 'HTTPS request returns a successful status',
  'tcp':   'TCP connection opens successfully',
  'exec':  'Command run inside the container exits with status 0',
};

export default {
  components: {
    LabeledInput, UnitInput, ShellInput, KeyValue,
  },

  props: {
    value: {
      type:    [Object, null],
      default: null,
    },
    mode: {
      type:    String,
      default: _EDIT,
    },

    label: {
      type:    String,
      default: 'Probe',
    },

    description: {
      type:    String,
      default: '',
    },

    forLiveness: {
      type:     Boolean,
      required: true,
    }
  },

  data() {
    let kind = 'none';
    let probe = null;
    let exec = null;
    let httpGet = null;
    let tcpSocket = null;

    if ( this.value ) {
      probe = clone(this.value);

      if ( probe.exec ) {
        kind = 'exec';
      } else if ( probe.httpGet ) {
        if ( (probe.httpGet.scheme || '').toLowerCase() === 'https' ) {
          kind = 'https';
        } else {
          kind = 'http';
        }
      } else if ( probe.tcpSocket ) {
        kind = 'tcp';
      }
    } else {
      probe = {
        failureThreshold:    3,
        successThreshold:    1,
        initialDelaySeconds: 0,
        timeoutSeconds:      1,
        periodSeconds:       10,
        exec:                null,
        httpGet:             null,
        tcpSocket:           null,
      };
    }

    exec = probe.exec || {};
    httpGet = probe.httpGet || {};
    tcpSocket = probe.tcpSocket || {};

    return {
      probe, kind, exec, httpGet, tcpSocket
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    isNone() {
      return this.kind === 'none';
    },

    kindLabels() {
      return KIND_LABELS;
    },

    kindChoices() {
      return Object.keys(KIND_LABELS).map((k) => {
        return { label: KIND_LABELS[k], value: k };
      });
    }
  },

  watch: {
    kind() {
      this.update();
    }
  },

  methods: {
    update() {
      const probe = this.probe;

      if ( this.isNone ) {
        this.$emit('input', null);

        return;
      }

      switch ( this.kind ) {
      case 'http':
      case 'https':
        this.httpGet.scheme = this.kind;
        probe.httpGet = this.httpGet;
        probe.tcpSocket = null;
        probe.exec = null;
        break;
      case 'tcp':
        probe.httpGet = null;
        probe.tcpSocket = this.tcpSocket;
        probe.exec = null;
        break;
      case 'exec':
        probe.httpGet = null;
        probe.tcpSocket = null;
        probe.exec = this.exec;
        break;
      }

      this.$emit('input', probe);
    }
  },
};
</script>

<template>
  <div>
    <div class="title clearfix">
      <h4>
        {{ label }}
        <i v-if="description" v-tooltip="description" class="icon icon-info" style="font-size: 16px" />
      </h4>
    </div>

    <div v-if="mode === 'view'">
      {{ kindLabels[kind] }}
    </div>
    <div v-else>
      <div v-for="opt in kindChoices" :key="opt.value">
        <label class="radio">
          <input v-model="kind" type="radio" :value="value" />
          {{ label }}
        </label>
      </div>
    </div>

    <hr />

    <div v-if="kind === 'http' || kind === 'https'">
      <div class="row">
        <div class="col span-12">
          <LabeledInput
            v-model="httpGet.port"
            type="number"
            min="1"
            max="65535"
            :mode="mode"
            label="Check Port"
            placeholder="e.g. 80"
          />
        </div>
      </div>

      <div class="row">
        <div class="col span-12">
          <LabeledInput
            v-model="httpGet.path"
            :mode="mode"
            label="Request Path"
            placeholder="e.g. /healthz"
          />
        </div>
      </div>

      <div class="row">
        <div class="col span-12">
          <KeyValue
            v-model="httpGet.headers"
            key-name="name"
            :mode="mode"
            :pad-left="false"
            :as-map="false"
            :read-allowed="false"
            title="Request Headers"
          />
        </div>
      </div>
    </div>

    <div v-if="kind === 'tcp'">
      <LabeledInput
        v-model="tcpSocket.port"
        type="number"
        min="1"
        max="65535"
        :mode="mode"
        label="Check Port"
        placeholder="e.g. 25"
      />
    </div>

    <div v-if="kind === 'exec'">
      <ShellInput
        v-model="exec.command"
        label="Command to run"
      />
    </div>

    <div v-if="!isNone">
      <hr />
      <div class="row">
        <div class="col span-6">
          <UnitInput
            v-model="probe.periodSeconds"
            :mode="mode"
            label="Check Interval"
            min="1"
            suffix="sec"
            placeholder="Default: 10"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            v-model="probe.successThreshold"
            type="number"
            min="1"
            :mode="mode"
            label="Success Threshold"
            placeholder="Default: 1"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            v-model="probe.failureThreshold"
            type="number"
            min="1"
            :mode="mode"
            label="Failure Threshold"
            placeholder="Default: 3"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <UnitInput
            v-model="probe.initialDelaySeconds"
            :mode="mode"
            label="Initial Delay"
            suffix="sec"
            min="0"
            placeholder="Default: 0"
          />
        </div>
        <div class="col span-6">
          <UnitInput
            v-model="probe.timeoutSeconds"
            mode="mode"
            label="Timeout"
            suffix="sec"
            min="0"
            placeholder="Default: 3"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

  .title {
    margin-bottom: 10px;
  }

</style>
