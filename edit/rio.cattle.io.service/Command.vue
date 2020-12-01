<script>
import LabeledInput from '@/components/form/LabeledInput';
import ShellInput from '@/components/form/ShellInput';
import UnitInput from '@/components/form/UnitInput';
import KeyValue from '@/components/form/KeyValue';
import Checkbox from '@/components/form/Checkbox';
export default {
  components: {
    LabeledInput, ShellInput, UnitInput, KeyValue, Checkbox
  },

  props: {
    spec: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
    namespace: {
      type:     String,
      required: true,
    },
    configMaps: {
      type:     Array,
      required: true,
    },
    secrets: {
      type:     Array,
      required: true,
    },
  },

  computed: {},

  created() {
    if ( !this.spec.env ) {
      this.spec.env = [];
    }
  },

  methods: {
    addConfigMap(rows) {
      rows.push({
        name:          '',
        configMapName: null,
        key:           null
      });
    },

    addSecret(rows) {
      rows.push({
        name:       '',
        secretName: null,
        key:        null
      });
    },

    changedRef(row, val, which) {
      delete row.configMapRef;
      delete row.secretRef;
      delete row.configMapName;
      delete row.secretName;

      row[`${ which }Ref`] = val;

      let name = null;
      let key = null;

      if ( val && val.includes('/') ) {
        const parts = val.split('/', 2);

        name = parts[0];
        key = parts[1];
      }

      row[`${ which }Name`] = name;
      row.key = key;
    },
  },
};
</script>
<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <ShellInput
          v-model="spec.entrypoint"
          :mode="mode"
          label="Entrypoint"
        />
      </div>
      <div class="col span-6">
        <ShellInput
          v-model="spec.command"
          :mode="mode"
          label="Command"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="spec.workingDir"
          :mode="mode"
          label="Working Directory"
        />
      </div>
      <div class="col span-6 pt-10">
        <div>
          <Checkbox v-model="spec.stdin" type="checkbox" label="Interactive" />

          <Checkbox v-model="spec.tty" type="checkbox" label="TTY" />

          <Checkbox v-model="spec.readOnlyRootFilesystem" type="checkbox" label="Read-Only Root FS" />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col span-3">
        <UnitInput
          v-model.number="spec.memoryBytes"
          :mode="mode"
          :increment="1024"
          :input-exponent="2"
          label="Memory Reservation"
          placeholder="Default: None"
        />
      </div>
      <div class="col span-3">
        <UnitInput
          v-model="spec.cpuMillis"
          :mode="mode"
          label="CPU Reservation"
          :increment="1000"
          :input-exponent="-1"
          suffix="CPUs"
          placeholder="Default: None"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model="spec.runAsUser"
          :mode="mode"
          label="Run as User number"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model="spec.runAsGroup"
          :mode="mode"
          label="Run as Group number"
        />
      </div>
    </div>

    <div class="spacer"></div>

    <KeyValue
      key="env"
      v-model="spec.env"
      key-name="name"
      :mode="mode"
      :as-map="false"
      :read-allowed="false"
      title="Environment Variables"
    >
      <template #value="{row}">
        <span v-if="typeof row.secretName !== 'undefined'">
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
      <template #moreAdd="{rows}">
        <button type="button" class="btn role-tertiary add" @click="addSecret(rows)">
          From Secret
        </button>
        <button type="button" class="btn role-tertiary add" @click="addConfigMap(rows)">
          From ConfigMap
        </button>
      </template>
    </KeyValue>
  </div>
</template>
