<script>
import RadioGroup from '@/components/form/RadioGroup';
import LabeledInput from '@/components/form/LabeledInput';
import ShellInput from '@/components/form/ShellInput';
import debounce from 'lodash/debounce';
import { _VIEW } from '@/config/query-params';

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
    RadioGroup, LabeledInput, ShellInput
  },

  data() {
    const t = this.$store.getters['i18n/t'];

    const httpGetOptions = [
      {
        label: t('workload.container.lifecycleHook.httpGet.host.label'), placeholder: t('workload.container.lifecycleHook.httpGet.host.placeholder'), value: 'host'
      },
      {
        label: t('workload.container.lifecycleHook.httpGet.path.label'), placeholder: t('workload.container.lifecycleHook.httpGet.path.placeholder'), value: 'path'
      },
      {
        label: t('workload.container.lifecycleHook.httpGet.port.label'), placeholder: t('workload.container.lifecycleHook.httpGet.port.placeholder'), value: 'port'
      },
      {
        label: t('workload.container.lifecycleHook.httpGet.scheme.label'), placeholder: t('workload.container.lifecycleHook.httpGet.scheme.placeholder'), value: 'scheme'
      }
    ];

    const tcpSocketOptions = [
      {
        label: t('workload.container.lifecycleHook.tcpSocket.host.label'), placeholder: t('workload.container.lifecycleHook.tcpSocket.host.placeholder'), value: 'host'
      },
      {
        label: t('workload.container.lifecycleHook.tcpSocket.port.label'), placeholder: t('workload.container.lifecycleHook.tcpSocket.port.placeholder'), value: 'port'
      },
    ];

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
      lifecycle: this.value,
      httpGetOptions,
      tcpSocketOptions,
      selectHook,
      defaultExec,
      defaultHttpGet,
      defaultTcpSocket
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
  },

  created() {
    this.queueUpdate = debounce(this.update, 500);
  },

  methods: {
    addHeader() {
      const header = { name: '', value: '' };

      this.lifecycle.httpGet.httpHeaders.push(header);
    },

    removeHeader(index) {
      this.lifecycle.httpGet.httpHeaders.splice(index, 1);
      this.queueUpdate();
    },

    update() {
      const { ...leftovers } = this.lifecycle;

      switch (this.selectHook) {
      case 'exec':
        this.deleteLeftovers(leftovers);
        Object.assign(this.lifecycle, this.defaultExec);
        break;
      case 'httpGet':
        this.deleteLeftovers(leftovers);
        Object.assign(this.lifecycle, this.defaultHttpGet);
        break;
      case 'tcpSocket':
        this.deleteLeftovers(leftovers);
        Object.assign(this.lifecycle, this.defaultTcpSocket);
        break;
      default:
        break;
      }
    },

    deleteLeftovers(leftovers) {
      if (leftovers) {
        for (const obj in leftovers) {
          delete this.lifecycle[obj];
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
        :options="['exec', 'httpGet', 'tcpSocket']"
        :labels="[
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
            v-model="lifecycle.exec.command"
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
            <div v-for="option in httpGetOptions" :key="option.vKey">
              <LabeledInput
                v-if="option.value === 'port'"
                v-model.number="lifecycle.httpGet[option.value]"
                type="number"
                :label="option.label"
                :placeholder="option.placeholder"
                :mode="mode"
              />
              <LabeledInput
                v-else
                v-model="lifecycle.httpGet[option.value]"
                :label="option.label"
                :placeholder="option.placeholder"
                :mode="mode"
              />
            </div>
          </div>
        </slot>
      </template>

      <template>
        <h4>{{ t('workload.container.lifecycleHook.httpHeaders.title') }}</h4>
        <template>
          <div v-for="(header, index) in lifecycle.httpGet.httpHeaders" :key="header.vKey" class="var-row">
            <LabeledInput
              v-model="lifecycle.httpGet.httpHeaders[index].name"
              :label="t('workload.container.lifecycleHook.httpHeaders.name.label')"
              :placeholder="t('workload.container.lifecycleHook.httpHeaders.name.placeholder')"
              class="single-value"
              :mode="mode"
            />
            <LabeledInput
              v-model="lifecycle.httpGet.httpHeaders[index].value"
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
          <div v-for="option in tcpSocketOptions" :key="option.vKey">
            <LabeledInput
              v-if="option.value === 'port'"
              v-model.number="lifecycle.tcpSocket[option.value]"
              type="number"
              :label="option.label"
              :placeholder="option.placeholder"
              :mode="mode"
            />
            <LabeledInput
              v-else
              v-model="lifecycle.tcpSocket[option.value]"
              :label="option.label"
              :placeholder="option.placeholder"
              :mode="mode"
            />
          </div>
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
