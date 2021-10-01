<script>
import RadioGroup from '@/components/form/RadioGroup';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import ShellInput from '@/components/form/ShellInput';
import debounce from 'lodash/debounce';
import { _VIEW } from '@/config/query-params';
import { isEmpty } from '@/utils/object';

export default {
  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  components: {
    RadioGroup, LabeledInput, LabeledSelect, ShellInput
  },

  data() {
    const selectHook = null;

    const defaultExec = { exec: { command: [] } };
    const defaultHttpGet = {
      httpGet: {
        host:        '',
        path:        '',
        port:        null,
        scheme:      '',
        httpHeaders: [{ name: '', value: '' }]
      }
    };
    const defaultTcpSocket = { tcpSocket: { host: '', port: null } };

    return {
      selectHook,
      defaultExec,
      defaultHttpGet,
      defaultTcpSocket,
      schemeOptions: ['HTTP', 'HTTPS']
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
  },

  created() {
    if (this.value) {
      this.selectHook = Object.keys(this.value)[0];
    }

    if (isEmpty(this.value)) {
      this.selectHook = 'none';
    }

    this.queueUpdate = debounce(this.update, 500);
  },

  methods: {
    addHeader() {
      const header = { name: '', value: '' };

      this.value.httpGet.httpHeaders.push(header);
    },

    removeHeader(index) {
      this.value.httpGet.httpHeaders.splice(index, 1);
      this.queueUpdate();
    },

    update() {
      const { ...leftovers } = this.value;

      switch (this.selectHook) {
      case 'none':
        this.deleteLeftovers(leftovers);
        break;
      case 'exec':
        this.deleteLeftovers(leftovers);
        Object.assign(this.value, this.defaultExec);
        break;
      case 'httpGet':
        this.deleteLeftovers(leftovers);
        Object.assign(this.value, this.defaultHttpGet);
        break;
      case 'tcpSocket':
        this.deleteLeftovers(leftovers);
        Object.assign(this.value, this.defaultTcpSocket);
        break;
      default:
        break;
      }

      this.$emit('input', this.value);
    },

    deleteLeftovers(leftovers) {
      if (leftovers) {
        for (const obj in leftovers) {
          delete this.value[obj];
        }
      }
    }
  }
};
</script>

<template>
  <div @input="update">
    <div class="row mb-10">
      <RadioGroup
        v-model="selectHook"
        name="selectHook"
        :options="['none', 'exec', 'httpGet', 'tcpSocket']"
        :labels="[
          t('generic.none'),
          t('workload.container.lifecycleHook.exec.add'),
          t('workload.container.lifecycleHook.httpGet.add'),
          t('workload.container.lifecycleHook.tcpSocket.add')
        ]"
        :mode="mode"
        @input="update"
      />
    </div>

    <template v-if="selectHook === 'exec'">
      <div class="mb-20 single-value">
        <h4>{{ t('workload.container.lifecycleHook.exec.title') }}</h4>
        <div>
          <ShellInput
            v-model="value.exec.command"
            :mode="mode"
            :label="t('workload.container.lifecycleHook.exec.command.label')"
            :placeholder="t('workload.container.lifecycleHook.exec.command.placeholder')"
          />
        </div>
      </div>
    </template>

    <template v-if="selectHook === 'httpGet'">
      <template>
        <h4>{{ t('workload.container.lifecycleHook.httpGet.title') }}</h4>
        <slot name="httpGetOption">
          <div class="var-row">
            <template>
              <LabeledInput
                v-model="value.httpGet.host"
                :label="t('workload.container.lifecycleHook.httpGet.host.label')"
                :placeholder="t('workload.container.lifecycleHook.httpGet.host.placeholder')"
                :mode="mode"
              />
            </template>
            <template>
              <LabeledInput
                v-model="value.httpGet.path"
                :label="t('workload.container.lifecycleHook.httpGet.path.label')"
                :placeholder="t('workload.container.lifecycleHook.httpGet.path.placeholder')"
                :mode="mode"
              />
            </template>
            <template>
              <LabeledInput
                v-model.number="value.httpGet.port"
                type="number"
                :label="t('workload.container.lifecycleHook.httpGet.port.label')"
                :placeholder="t('workload.container.lifecycleHook.httpGet.port.placeholder')"
                :mode="mode"
              />
            </template>
            <template>
              <LabeledSelect
                v-model="value.httpGet.scheme"
                :label="t('workload.container.lifecycleHook.httpGet.scheme.label')"
                :placeholder="t('workload.container.lifecycleHook.httpGet.scheme.placeholder')"
                :options="schemeOptions"
                :mode="mode"
              />
            </template>
          </div>
        </slot>
      </template>

      <template>
        <h4>{{ t('workload.container.lifecycleHook.httpHeaders.title') }}</h4>
        <template>
          <div v-for="(header, index) in value.httpGet.httpHeaders" :key="header.vKey" class="var-row">
            <LabeledInput
              v-model="value.httpGet.httpHeaders[index].name"
              :label="t('workload.container.lifecycleHook.httpHeaders.name.label')"
              :placeholder="t('workload.container.lifecycleHook.httpHeaders.name.placeholder')"
              class="single-value"
              :mode="mode"
            />
            <LabeledInput
              v-model="value.httpGet.httpHeaders[index].value"
              :label="t('workload.container.lifecycleHook.httpHeaders.value.label')"
              :placeholder="t('workload.container.lifecycleHook.httpHeaders.value.placeholder')"
              class="single-value"
              :mode="mode"
            />
            <button
              v-if="!isView"
              type="button"
              class="btn role-link"
              :disabled="mode==='view'"
              @click.stop="removeHeader(index)"
            >
              <t k="generic.remove" />
            </button>
          </div>
        </template>
        <div>
          <button
            v-if="!isView"
            type="button"
            class="btn role-link mb-20"
            :disabled="mode === 'view'"
            @click.stop="addHeader"
          >
            Add Header
          </button>
        </div>
      </template>
    </template>

    <template v-if="selectHook === 'tcpSocket'">
      <h4>{{ t('workload.container.lifecycleHook.tcpSocket.title') }}</h4>
      <template>
        <div class="var-row">
          <template>
            <LabeledInput
              v-model="value.tcpSocket.host"
              :label="t('workload.container.lifecycleHook.tcpSocket.host.label')"
              :placeholder="t('workload.container.lifecycleHook.tcpSocket.host.placeholder')"
              :mode="mode"
            />
          </template>
          <template>
            <LabeledInput
              v-model.number="value.tcpSocket.port"
              type="number"
              :label="t('workload.container.lifecycleHook.tcpSocket.port.label')"
              :placeholder="t('workload.container.lifecycleHook.tcpSocket.port.label')"
              :mode="mode"
            />
          </template>
        </div>
      </template>
    </template>
  </div>
</template>

<style lang='scss' scoped>
.var-row{
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 100px;
  grid-column-gap: 20px;
  margin-bottom: 20px;
  align-items: center;

  .single-value {
    grid-column: span 2;
  }
}
</style>
