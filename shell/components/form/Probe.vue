<script>
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { clone } from '@shell/utils/object';
import UnitInput from '@shell/components/form/UnitInput';
import { LabeledInput } from '@rc/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ShellInput from '@shell/components/form/ShellInput';
import KeyValue from '@shell/components/form/KeyValue';
import { computed, ref, watch } from 'vue';

const KINDS = [
  'none',
  'HTTP',
  'HTTPS',
  'tcp',
  'exec',
];

export default {
  emits: ['update:value'],

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

  setup(props, { emit }) {
    const kind = ref('none');
    const probe = ref(null);
    const exec = ref(null);
    const httpGet = ref(null);
    const tcpSocket = ref(null);

    if ( props.value ) {
      probe.value = clone(props.value);

      if ( probe.value.exec ) {
        kind.value = 'exec';
      } else if ( probe.value.httpGet ) {
        if ( (probe.value.httpGet.scheme || '').toLowerCase() === 'https' ) {
          kind.value = 'HTTPS';
        } else {
          kind.value = 'HTTP';
        }
      } else if ( probe.value.tcpSocket ) {
        kind.value = 'tcp';
      }
    } else {
      probe.value = {
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

    exec.value = probe.value.exec || {};
    httpGet.value = probe.value.httpGet || {};
    tcpSocket.value = probe.value.tcpSocket || {};

    const isNone = computed(() => {
      return kind.value === 'none';
    });

    const update = () => {
      if ( isNone.value ) {
        emit('update:value', null);

        return;
      }

      switch ( kind.value ) {
      case 'HTTP':
      case 'HTTPS':
        httpGet.value.scheme = kind.value;
        probe.value.httpGet = httpGet.value;
        probe.value.tcpSocket = null;
        probe.value.exec = null;
        break;
      case 'tcp':
        probe.value.httpGet = null;
        probe.value.tcpSocket = tcpSocket.value;
        probe.value.exec = null;
        break;
      case 'exec':
        probe.value.httpGet = null;
        probe.value.tcpSocket = null;
        probe.value.exec = exec.value;
        break;
      }

      emit('update:value', probe.value);
    };

    watch(kind, () => {
      update();
    });

    return {
      probe,
      kind,
      exec,
      httpGet,
      tcpSocket,
      update,
      isNone,
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    kindOptions() {
      return KINDS.map((k) => {
        return { label: this.t(`workload.container.healthCheck.kind.${ k }`), value: k };
      });
    }
  },
};
</script>

<template>
  <div>
    <div class="title clearfix">
      <h3>
        {{ label }}
        <i
          v-if="description"
          v-clean-tooltip="description"
          class="icon icon-info"
        />
      </h3>
    </div>
    <div class="row">
      <div
        data-testid="input-probe-kind"
        class="col span-11-of-23"
      >
        <LabeledSelect
          v-model:value="kind"
          :mode="mode"
          :label="t('probe.type.label')"
          :options="kindOptions"
          :placeholder="t('probe.type.placeholder')"
          @update:value="update"
        />

        <div
          v-if="kind && kind!=='none'"
          class="spacer-small"
        />

        <!-- HTTP/HTTPS -->
        <div
          v-if="kind === 'HTTP' || kind === 'HTTPS'"
          data-testid="input-probe-port"
        >
          <LabeledInput
            v-model:value.number="httpGet.port"
            type="number"
            min="1"
            max="65535"
            :mode="mode"
            :label="t('probe.httpGet.port.label')"
            :placeholder="t('probe.httpGet.port.placeholder')"
            @update:value="update"
          />

          <div class="spacer-small" />

          <div data-testid="input-probe-path">
            <LabeledInput
              v-model:value="httpGet.path"
              :mode="mode"
              :label="t('probe.httpGet.path.label')"
              :placeholder="t('probe.httpGet.path.placeholder')"
              @update:value="update"
            />
          </div>
        </div>

        <!-- TCP -->
        <div
          v-if="kind === 'tcp'"
          data-testid="input-probe-socket"
        >
          <LabeledInput
            v-model:value.number="tcpSocket.port"
            type="number"
            min="1"
            max="65535"
            :mode="mode"
            :label="t('probe.httpGet.port.label')"
            :placeholder="t('probe.httpGet.port.placeholderDeux')"
            @update:value="update"
          />
          <div class="spacer-small" />
        </div>

        <!-- Exec -->
        <div
          v-if="kind === 'exec'"
          data-testid="input-probe-command"
        >
          <div class="col span-12">
            <ShellInput
              v-model:value="exec.command"
              :label="t('probe.command.label')"
              :placeholder="t('probe.command.placeholder')"
              @update:value="update"
            />
          </div>
          <div class="spacer-small" />
        </div>
      </div>

      <div class="col span-1-of-13">
        <hr
          v-if="kind && kind!=='none'"
          :style="{'position':'relative', 'margin':'0px'}"
          class="vertical"
          role="none"
        >
      </div>

      <!-- none -->
      <div
        v-if="!isNone"
        class="col span-11-of-23"
      >
        <div class="row">
          <div
            data-testid="input-probe-periodSeconds"
            class="col span-4"
          >
            <UnitInput
              v-model:value="probe.periodSeconds"
              :mode="mode"
              :label="t('probe.checkInterval.label')"
              min="1"
              :suffix="t('suffix.sec')"
              :placeholder="t('probe.checkInterval.placeholder')"
              @update:value="update"
            />
          </div>
          <div
            data-testid="input-probe-initialDelaySeconds"
            class="col span-4"
          >
            <UnitInput
              v-model:value="probe.initialDelaySeconds"
              :mode="mode"
              :suffix="t('suffix.sec')"
              :label="t('probe.initialDelay.label')"
              min="0"
              :placeholder="t('probe.initialDelay.placeholder')"
              @update:value="update"
            />
          </div>
          <div
            data-testid="input-probe-timeoutSeconds"
            class="col span-4"
          >
            <UnitInput
              v-model:value="probe.timeoutSeconds"
              min="0"
              :mode="mode"
              :suffix="t('suffix.sec')"
              :label="t('probe.timeout.label')"
              :placeholder="t('probe.timeout.placeholder')"
              @update:value="update"
            />
          </div>
        </div>

        <div class="spacer-small" />

        <div class="row">
          <div
            data-testid="input-probe-successThreshold"
            class="col span-6"
          >
            <LabeledInput
              v-model:value.number="probe.successThreshold"
              type="number"
              min="1"
              :mode="mode"
              :label="t('probe.successThreshold.label')"
              :placeholder="t('probe.successThreshold.placeholder')"
              @update:value="update"
            />
          </div>
          <div
            data-testid="input-probe-failureThreshold"
            class="col span-6"
          >
            <LabeledInput
              v-model:value.number="probe.failureThreshold"
              type="number"
              min="1"
              :mode="mode"
              :label="t('probe.failureThreshold.label')"
              :placeholder="t('probe.failureThreshold.placeholder')"
              @update:value="update"
            />
          </div>
        </div>

        <template v-if="kind === 'HTTP' || kind === 'HTTPS'">
          <div class="spacer-small" />

          <div class="row">
            <div class="col span-12">
              <KeyValue
                v-model:value="httpGet.httpHeaders"
                data-testid="input-probe-http-headers"
                key-name="name"
                :mode="mode"
                :as-map="false"
                :read-allowed="false"
                :title="t('probe.httpGet.headers.label')"
                :key-label="t('generic.name')"
                :value-label="t('generic.value')"
                :add-label="t('generic.add')"
                @update:value="update"
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
  :deep() .labeled-select {
    height: auto;
  }

</style>
