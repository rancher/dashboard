<script>
import debounce from 'lodash/debounce';
import RadioGroup from '@shell/components/form/RadioGroup';
import LabeledInput from '@shell/components/form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ShellInput from '@shell/components/form/ShellInput';
import { _VIEW } from '@shell/config/query-params';
import { isEmpty } from '@shell/utils/object';

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
        httpHeaders: null
      }
    };

    return {
      selectHook,
      defaultExec,
      defaultHttpGet,
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

      if (!this.value.httpGet.httpHeaders) {
        this.$set(this.value.httpGet, 'httpHeaders', []);
      }

      this.value.httpGet.httpHeaders.push(header);
    },

    removeHeader(index) {
      this.value.httpGet.httpHeaders.splice(index, 1);
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
  <div>
    <div class="row mb-10">
      <RadioGroup
        v-model="selectHook"
        name="selectHook"
        :options="['none', 'exec', 'httpGet']"
        :labels="[
          t('generic.none'),
          t('workload.container.lifecycleHook.exec.add'),
          t('workload.container.lifecycleHook.httpGet.add'),
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
            :placeholder="t('workload.container.lifecycleHook.exec.command.placeholder', null, true)"
            required
          />
        </div>
      </div>
    </template>

    <template v-if="selectHook === 'httpGet'">
      <h4>{{ t('workload.container.lifecycleHook.httpGet.title') }}</h4>
      <div class="var-row">
        <template @input="update">
          <LabeledInput
            v-model="value.httpGet.host"
            :label="t('workload.container.lifecycleHook.httpGet.host.label')"
            :placeholder="t('workload.container.lifecycleHook.httpGet.host.placeholder')"
            :mode="mode"
          />
          <LabeledInput
            v-model="value.httpGet.path"
            :label="t('workload.container.lifecycleHook.httpGet.path.label')"
            :placeholder="t('workload.container.lifecycleHook.httpGet.path.placeholder')"
            :mode="mode"
          />
          <LabeledInput
            v-model.number="value.httpGet.port"
            type="number"
            :label="t('workload.container.lifecycleHook.httpGet.port.label')"
            :placeholder="t('workload.container.lifecycleHook.httpGet.port.placeholder')"
            :mode="mode"
            required
          />
          <LabeledSelect
            v-model="value.httpGet.scheme"
            :label="t('workload.container.lifecycleHook.httpGet.scheme.label')"
            :placeholder="t('workload.container.lifecycleHook.httpGet.scheme.placeholder')"
            :options="schemeOptions"
            :mode="mode"
          />
        </template>
      </div>

      <h4>{{ t('workload.container.lifecycleHook.httpHeaders.title') }}</h4>
      <div v-for="(header, index) in value.httpGet.httpHeaders" :key="header.id" class="var-row">
        <template @input="update">
          <LabeledInput
            v-model="value.httpGet.httpHeaders[index].name"
            :label="t('workload.container.lifecycleHook.httpHeaders.name.label')"
            :placeholder="t('workload.container.lifecycleHook.httpHeaders.name.placeholder')"
            class="single-value"
            :mode="mode"
            required
          />
          <LabeledInput
            v-model="value.httpGet.httpHeaders[index].value"
            :label="t('workload.container.lifecycleHook.httpHeaders.value.label')"
            :placeholder="t('workload.container.lifecycleHook.httpHeaders.value.placeholder')"
            class="single-value"
            :mode="mode"
          />
        </template>

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

  .labeled-select {
    min-height: $input-height;
  }
}
</style>
