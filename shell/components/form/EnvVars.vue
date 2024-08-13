<script>
import ValueFromResource from '@shell/components/form/ValueFromResource';
import debounce from 'lodash/debounce';
import { randomStr } from '@shell/utils/string';
import { _VIEW } from '@shell/config/query-params';

export default {
  components: { ValueFromResource },

  props: {
    /**
     * Form mode for the component
     */
    mode: {
      type:     String,
      required: true,
    },
    configMaps: {
      type:     Array,
      required: true
    },
    secrets: {
      type:     Array,
      required: true
    },
    loading: {
      default: false,
      type:    Boolean
    },
    /**
     * Container spec
     */
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    const { env = [], envFrom = [] } = this.value;

    const allEnv = [...env, ...envFrom].map((row) => {
      return { value: row, id: randomStr(4) };
    });

    return {
      env, envFrom, allEnv
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    }
  },

  watch: {
    'value.tty'(neu) {
      if (neu) {
        this.value['stdin'] = true;
      }
    }
  },
  created() {
    this.queueUpdate = debounce(this.update, 500);
  },

  methods: {
    update() {
      delete this.value.env;
      delete this.value.envFrom;
      const envVarSource = [];
      const envVar = [];

      this.allEnv.forEach((row) => {
        if (!row.value) {
          return;
        }
        if (!!row.value.configMapRef || !!row.value.secretRef) {
          envVarSource.push(row.value);
        } else {
          envVar.push(row.value);
        }
      });
      this.value['env'] = envVar;
      this.value['envFrom'] = envVarSource;
    },

    updateRow() {
      this.queueUpdate();
    },

    removeRow(idx) {
      this.allEnv.splice(idx, 1);
      this.queueUpdate();
    },

    addFromReference() {
      this.allEnv.push({ value: { name: '', valueFrom: {} }, id: randomStr(4) });
    },
  },
};
</script>
<template>
  <div :style="{'width':'100%'}">
    <div
      v-for="(row, i) in allEnv"
      :key="i"
    >
      <ValueFromResource
        v-model:value="row.value"
        :all-secrets="secrets"
        :all-config-maps="configMaps"
        :mode="mode"
        :loading="loading"
        @remove="removeRow(i)"
        @update:value="updateRow"
      />
    </div>
    <button
      v-if="!isView"
      v-t="'workload.container.command.addEnvVar'"
      type="button"
      class="btn role-tertiary add"
      data-testid="add-env-var"
      @click="addFromReference"
    />
  </div>
</template>

<style lang='scss' scoped>
.value-from :deep() {
  .v-select {
    height: 50px;
  }

  INPUT:not(.vs__search) {
    height: 50px;
  }
}
.value-from, .value-from-headers {
  display: grid;
  grid-template-columns: 20% 20% 20% 5% 20% auto;
  grid-gap: $column-gutter;
  align-items: center;
  margin-bottom: 10px;
}
  .value-from-headers {
    margin: 10px 0px 10px 0px;
    color: var(--input-label);
    }
</style>
