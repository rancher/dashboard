<script>
import KeyValue from '@/components/form/KeyValue';
import ValueFromResource from '@/components/form/ValueFromResource';

export default {
  components: {
    KeyValue,
    ValueFromResource,
  },

  props: {
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
    // container spec
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    const { env = [], envFrom = [] } = this.value;

    // UI has two groups: from resource (referencedValues), not from resource (unreferencedValues)
    // api spec has two different groups: key ref (env) or entire-resource's-key ref (envFrom)
    const allEnv = [...env, ...envFrom];

    const referencedValues = allEnv.filter((val) => {
      return !!val.valueFrom || !!val.secretRef || !!val.configMapRef;
    });

    const unreferencedValues = env.filter((val) => {
      return !val.valueFrom && !val.secretRef && !val.configmapRef;
    });

    return {
      env, envFrom, referencedValues, unreferencedValues
    };
  },

  watch: {
    'value.tty'(neu) {
      if (neu) {
        this.$set(this.value, 'stdin', true);
      }
    }
  },

  methods: {
    update() {
      // env should contain all unreferenced values and referenced values that refer to only part of a resource, ie contain 'valueFrom' key
      const env = [...this.unreferencedValues, ...this.referencedValues.filter(val => !!val.valueFrom)];
      const envFrom = this.referencedValues.filter(val => !!val.configmapRef || !!val.secretRef);

      Object.assign(this.value, { env, envFrom });
    },

    updateRow(idx, neu, old) {
      const newArr = [...this.referencedValues];

      if (neu) {
        newArr[idx] = neu;
      } else {
        newArr.splice(idx, 1);
      }
      this.referencedValues = newArr;
      this.update();
    },

    addFromReference() {
      this.referencedValues.push({ name: '', valueFrom: {} });
    },
  },
};
</script>
<template>
  <div :style="{'width':'100%'}" @input="update">
    <KeyValue
      key="env"
      ref="unreferencedKV"
      v-model="unreferencedValues"
      key-name="name"
      :mode="mode"
      :pad-left="false"
      :as-map="false"
      :read-allowed="false"
      :add-allowed="false"
      class="mb-10"
    >
      <template #key="{row}">
        <span v-if="row.valueFrom" />
      </template>
      <template #removeButton="{row}">
        <span v-if="row.valueFrom" />
      </template>
      <template #value="{row}">
        <span v-if="row.valueFrom" />
        <span v-else-if="typeof row.secretName !== 'undefined'">
          <select v-model="row.secretRef" @input="changedRef(row, $event.target.value, 'secret')">
            <option disabled value="">Select a Secret Key...</option>
            <optgroup v-for="grp in secrets" :key="grp.group" :label="grp.group">
              <option v-for="opt in grp.items" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </optgroup>
          </select>
        </span>
        <span v-else-if="typeof row.configMapName !== 'undefined'">
          <select v-model="row.configMapRef" @input="changedRef(row, $event.target.value, 'configMap')">
            <option disabled value="">Select a Config Map Key...</option>
            <optgroup v-for="grp in configMaps" :key="grp.group" :label="grp.group">
              <option v-for="opt in grp.items" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </optgroup>
          </select>
        </span>
      </template>
      <template #add>
        <span />
      </template>
    </KeyValue>
    <div v-if="referencedValues.length" class="value-from-headers">
      <span>
        {{ t('workload.container.command.fromResource.type') }}
      </span>
      <span>
        {{ t('workload.container.command.fromResource.source.label') }}
      </span>
      <span>
        {{ t('workload.container.command.fromResource.key.label') }}
      </span>
      <span />
      <span>
        {{ t('workload.container.command.fromResource.prefix') }}
      </span>
      <span />
    </div>
    <ValueFromResource
      v-for="(val,i) in referencedValues"
      :key="`${i}`"
      class="value-from"
      :row="val"
      :all-secrets="secrets"
      :all-config-maps="configMaps"
      :mode="mode"
      @input="e=>updateRow(i, e.value, e.old)"
    />
    <template v-if="mode!=='view'">
      <button v-if="mode!=='view'" type="button" class="btn btn-sm role-tertiary" @click="$refs.unreferencedKV.add()">
        <t k="generic.add" />
      </button>
      <button class="btn btn-sm role-link" @click="addFromReference">
        <t k="workload.container.command.addFromResource" />
      </button>
    </template>
  </div>
</template>

<style lang='scss'>
.value-from  INPUT, .value-from .v-select {
  height: 50px;
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
