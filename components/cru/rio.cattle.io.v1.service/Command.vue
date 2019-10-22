<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import ShellInput from '@/components/form/ShellInput';
import UnitInput from '@/components/form/UnitInput';
import KeyValue from '@/components/form/KeyValue';

export default {
  components: {
    LabeledSelect, LabeledInput, ShellInput, UnitInput, KeyValue
  },

  props:      {
    spec: {
      type:     Object,
      required: true,
    },
    mode: {
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

    changedSecret(row) {
      debugger;
    },

    changedConfigMap(row) {
      debugger;
    },
  },
};
</script>
<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <UnitInput
          v-model="spec.memory"
          :increment="1024"
          label="Memory Reservation"
          placeholder="Default: None"
        />
      </div>
      <div class="col span-6">
        <UnitInput
          v-model="spec.cpu"
          label="CPU Reservation"
          :increment="1000"
          :input-exponent="-1"
          suffix="CPUs"
          placeholder="Default: None"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-9">
        <ShellInput
          v-model="spec.entrypoint"
          label="Entrypoint"
        />
      </div>

      <div class="col span-3 pt-5">
        <div><label class="checkbox"><input v-model="spec.stdin" type="checkbox" /> Interactive</label></div>
        <div><label class="checkbox"><input v-model="spec.tty" type="checkbox" /> TTY</label></div>
        <div><label class="checkbox"><input v-model="spec.readOnlyRootFilesystem" type="checkbox" /> Read-Only Root FS</label></div>
      </div>
    </div>

    <div class="row">
      <div class="col span-12">
        <ShellInput
          v-model="spec.command"
          label="Command"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-4">
        <LabeledInput
          v-model="spec.workingDir"
          label="Working Directory"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="spec.runAsUser"
          label="Run as User number"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="spec.runAsGroup"
          label="Run as Group number"
        />
      </div>
    </div>

    <hr />

    <KeyValue
      key="env"
      v-model="spec.env"
      key-name="name"
      :mode="mode"
      :pad-left="false"
      :as-map="false"
      :read-allowed="false"
      title="Environment Variables"
    >
      <template #value="{row, isView}">
        <span v-if="typeof row.secretName !== 'undefined'">
          <LabeledSelect
            v-model="row.secretRef"
            :mode="mode"
            :options="secrets"
            label="Secret"
            @input="changedSecret(row)"
          >
            <template #options="{options}">
              <optgroup v-for="grp in options" :key="grp.group" :label="grp.group">
                <option v-for="opt in grp.items" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </optgroup>
            </template>
          </LabeledSelect>
        </span>
        <span v-else-if="typeof row.configMapName !== 'undefined'">
          <LabeledSelect
            v-model="row.configMapRef"
            :mode="mode"
            :options="configMaps"
            label="Config Map"
            @input="changedConfigMap(row)"
          >
            <template #options="{options}">
              <optgroup v-for="grp in options" :key="grp.group" :label="grp.group">
                <option v-for="opt in grp.items" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </optgroup>
            </template>
          </LabeledSelect>
        </span>
      </template>
      <template #moreAdd="{rows}">
        <button type="button" class="btn bg-primary add" @click="addSecret(rows)">
          <i class="icon icon-plus" /> From Secret
        </button>
        <button type="button" class="btn bg-primary add" @click="addConfigMap(rows)">
          <i class="icon icon-plus" /> From ConfigMap
        </button>
      </template>
    </KeyValue>
  </div>
</template>
