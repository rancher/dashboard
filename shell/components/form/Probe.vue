<script>
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { clone } from '@shell/utils/object';
import UnitInput from '@shell/components/form/UnitInput';
import LabeledInput from '@shell/components/form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ShellInput from '@shell/components/form/ShellInput';
import KeyValue from '@shell/components/form/KeyValue';

const KINDS = [
  'none',
  'HTTP',
  'HTTPS',
  'tcp',
  'exec',
];

export default {
  components: {
    LabeledInput, LabeledSelect, UnitInput, ShellInput, KeyValue,
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
          kind = 'HTTPS';
        } else {
          kind = 'HTTP';
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

    kindOptions() {
      return KINDS.map((k) => {
        return { label: this.t(`workload.container.healthCheck.kind.${ k }`), value: k };
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
      case 'HTTP':
      case 'HTTPS':
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
  <div @input="update">
    <div class="title clearfix">
      <h3>
        {{ label }}
        <i v-if="description" v-tooltip="description" class="icon icon-info" />
      </h3>
    </div>
    <div class="row">
      <div class="col span-11-of-23">
        <LabeledSelect
          v-model="kind"
          :mode="mode"
          :label="t('probe.type.label')"
          :options="kindOptions"
          :placeholder="t('probe.type.placeholder')"
        />

        <div v-if="kind && kind!=='none'" class="spacer-small" />

        <div v-if="kind === 'HTTP' || kind === 'HTTPS'">
          <LabeledInput
            v-model.number="httpGet.port"
            type="number"
            min="1"
            max="65535"
            :mode="mode"
            :label="t('probe.httpGet.port.label')"
            :placeholder="t('probe.httpGet.port.placeholder')"
          />

          <div class="spacer-small" />

          <LabeledInput
            v-model="httpGet.path"
            :mode="mode"
            :label="t('probe.httpGet.path.label')"
            :placeholder="t('probe.httpGet.path.placeholder')"
          />
        </div>

        <div v-if="kind === 'tcp'">
          <LabeledInput
            v-model.number="tcpSocket.port"
            type="number"
            min="1"
            max="65535"
            :mode="mode"
            :label="t('probe.httpGet.port.label')"
            :placeholder="t('probe.httpGet.port.placeholderDeux')"
          />
          <div class="spacer-small" />
        </div>

        <div v-if="kind === 'exec'">
          <div class="col span-12">
            <ShellInput
              v-model="exec.command"
              :label="t('probe.command.label')"
              :placeholder="t('probe.command.placeholder')"
            />
          </div>
          <div class="spacer-small" />
        </div>
      </div>

      <div class="col span-1-of-13">
        <hr v-if="kind && kind!=='none'" :style="{'position':'relative', 'margin':'0px'}" class="vertical" />
      </div>

      <div v-if="!isNone" class="col span-11-of-23">
        <div class="row">
          <div class="col span-4">
            <UnitInput
              v-model="probe.periodSeconds"
              :mode="mode"
              :label="t('probe.checkInterval.label')"
              min="1"
              :suffix="t('suffix.sec')"
              :placeholder="t('probe.checkInterval.placeholder')"
            />
          </div>
          <div class="col span-4">
            <UnitInput
              v-model="probe.initialDelaySeconds"
              :mode="mode"
              :suffix="t('suffix.sec')"
              :label="t('probe.initialDelay.label')"
              min="0"
              :placeholder="t('probe.initialDelay.placeholder')"
            />
          </div>
          <div class="col span-4">
            <UnitInput
              v-model="probe.timeoutSeconds"
              :mode="mode"
              :suffix="t('suffix.sec')"
              :label="t('probe.timeout.placeholder')"
              min="0"
              :placeholder="t('probe.timeout.placeholder')"
            />
          </div>
        </div>

        <div class="spacer-small" />

        <div class="row">
          <div class="col span-6">
            <LabeledInput
              v-model.number="probe.successThreshold"
              type="number"
              min="1"
              :mode="mode"
              :label="t('probe.successThreshold.label')"
              :placeholder="t('probe.successThreshold.placeholder')"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model.number="probe.failureThreshold"
              type="number"
              min="1"
              :mode="mode"
              :label="t('probe.failureThreshold.label')"
              :placeholder="t('probe.failureThreshold.label')"
            />
          </div>
        </div>

        <template v-if="kind === 'HTTP' || kind === 'HTTPS'">
          <div class="spacer-small" />

          <div class="row">
            <div class="col span-12">
              <KeyValue
                v-model="httpGet.httpHeaders"
                key-name="name"
                :mode="mode"
                :as-map="false"
                :read-allowed="false"
                :title="t('probe.httpGet.headers.label')"
                :key-label="t('generic.name')"
                :value-label="t('generic.value')"
                :add-label="t('generic.add')"
              >
                <template #title>
                  <h3>
                    {{ t('workload.container.healthCheck.httpGet.headers') }}
                  </h3>
                </template>
              </KeyValue>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

  .title {
    margin-bottom: 10px;
  }
  ::v-deep .labeled-select {
    height: auto;
  }

</style>
