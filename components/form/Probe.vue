<script>
import { _EDIT, _VIEW } from '@/config/query-params';
import { clone } from '@/utils/object';
import UnitInput from '@/components/form/UnitInput';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import ShellInput from '@/components/form/ShellInput';
import KeyValue from '@/components/form/KeyValue';

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
      <h4 :style="{'display':'flex'}">
        {{ label }}
        <i v-if="description" v-tooltip="description" class="icon icon-info" style="font-size: 12px" />
      </h4>
    </div>
    <div class="row">
      <div class="col span-11-of-23">
        <LabeledSelect
          v-if="!isView || kind!=='none'"
          v-model="kind"
          :mode="mode"
          :label="t('generic.type')"
          :options="kindOptions"
          placeholder="Select a check type"
        />

        <div v-if="kind && kind!=='none'" class="spacer-small" />

        <div v-if="kind === 'HTTP' || kind === 'HTTPS'">
          <LabeledInput
            v-model.number="httpGet.port"
            type="number"
            min="1"
            max="65535"
            :mode="mode"
            :label="t('workload.container.healthCheck.httpGet.port')"
            placeholder="e.g. 80"
          />

          <div class="spacer-small" />

          <LabeledInput
            v-model="httpGet.path"
            :mode="mode"
            :label="t('workload.container.healthCheck.httpGet.path')"
            placeholder="e.g. /healthz"
          />
        </div>

        <div v-if="kind === 'tcp'">
          <LabeledInput
            v-model.number="tcpSocket.port"
            type="number"
            min="1"
            max="65535"
            :mode="mode"
            :label="t('workload.container.healthCheck.httpGet.port')"
            placeholder="e.g. 25"
          />
          <div class="spacer-small" />
        </div>

        <div v-if="kind === 'exec'">
          <div class="col span-12">
            <ShellInput
              v-model="exec.command"
              :label="t('workload.container.healthCheck.command.command')"
              placeholder="e.g. cat /tmp/health"
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
              :label="t('workload.container.healthCheck.checkInterval')"
              min="1"
              :suffix="t('suffix.sec')"
              placeholder="Default: 10"
            />
          </div>
          <div class="col span-4">
            <UnitInput
              v-model="probe.initialDelaySeconds"
              :mode="mode"
              :label="t('workload.container.healthCheck.initialDelay')"
              :suffix="t('suffix.sec')"
              min="0"
              placeholder="Default: 0"
            />
          </div>
          <div class="col span-4">
            <UnitInput
              v-model="probe.timeoutSeconds"
              :mode="mode"
              :label="t('workload.container.healthCheck.timeout')"
              :suffix="t('suffix.sec')"
              min="0"
              placeholder="Default: 3"
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
              :label="t('workload.container.healthCheck.successThreshold')"
              placeholder="Default: 1"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model.number="probe.failureThreshold"
              type="number"
              min="1"
              :mode="mode"
              :label="t('workload.container.healthCheck.failureThreshold')"
              placeholder="Default: 3"
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
                :pad-left="false"
                :as-map="false"
                :read-allowed="false"
                :title="t('workload.container.healthCheck.httpGet.headers')"
                :key-label="t('generic.name')"
                :value-label="t('generic.value')"
                :add-label="t('generic.add')"
              >
                <template #title>
                  <h4>
                    {{ t('workload.container.healthCheck.httpGet.headers') }}
                  </h4>
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

</style>
