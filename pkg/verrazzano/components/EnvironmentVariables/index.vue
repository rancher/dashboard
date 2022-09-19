<script>
// Added by Verrazzano
import EnvVarValueFromResource from '@pkg/components/EnvironmentVariables/EnvVarValueFromResource';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import debounce from 'lodash/debounce';
import { randomStr } from '@shell/utils/string';

export default {
  name:       'EnvironmentVariables',
  components: { EnvVarValueFromResource },
  mixins:     [VerrazzanoHelper],
  props:      {
    /**
     * Container for env and/or envFrom
     */
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:     String,
      required: true,
    },
    namespacedObject: {
      type:     Object,
      required: true
    },
    enableEnvFromOptions: {
      type:    Boolean,
      default: true
    },
  },
  data() {
    const { env = [], envFrom = [] } = this.value;
    let allEnvArray;

    if (this.enableEnvFromOptions) {
      allEnvArray = [...env, ...envFrom];
    } else {
      allEnvArray = [...env];
    }

    const allEnv = allEnvArray.map((row) => {
      return { value: row, id: randomStr(4) };
    });

    const result = {
      env,
      allEnv,
    };

    if (this.enableEnvFromOptions) {
      result.envFrom = envFrom;
    }

    return result;
  },
  methods: {
    update() {
      delete this.value.env;

      if (this.enableEnvFromOptions) {
        delete this.value.envFrom;
      }
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
      this.setFieldIfNotEmpty('env', envVar);

      if (this.enableEnvFromOptions) {
        this.setFieldIfNotEmpty('envFrom', envVarSource);
      }
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
  created() {
    this.queueUpdate = debounce(this.update, 500);
  },
};
</script>

<template>
  <div :style="{'width':'100%'}">
    <div v-for="(row, i) in allEnv" :key="row.id">
      <EnvVarValueFromResource
        v-model="row.value"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :enable-env-from-options="false"
        @remove="removeRow(i)"
        @input="updateRow"
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
.value-from ::v-deep {
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
