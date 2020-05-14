<script>
import LabeledInput from '@/components/form/LabeledInput';
import ShellInput from '@/components/form/ShellInput';
import UnitInput from '@/components/form/UnitInput';
import KeyValue from '@/components/form/KeyValue';
import Checkbox from '@/components/form/Checkbox';
import ValueFromResource from '@/edit/workload/ValueFromResource';

export default {
  components: {
    LabeledInput,
    ShellInput,
    UnitInput,
    KeyValue,
    Checkbox,
    ValueFromResource
  },

  props: {
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
      required: true
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    const spec = { ...this.value };
    const {
      env = [], envFrom = [], resources = {}, securityContext = {}
    } = spec;
    const { limits = {}, requests = {} } = resources;

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
      spec, env, envFrom, limits, requests, securityContext, referencedValues, unreferencedValues
    };
  },

  methods: {
    update() {
      // env should contain all unreferenced values and referenced values that refer to only part of a resource, ie contain 'valueFrom' key
      const env = [...this.unreferencedValues, ...this.referencedValues.filter(val => !!val.valueFrom)];
      const envFrom = this.referencedValues.filter(val => !!val.configmapRef || !!val.secretRef);
      const resources = { requests: this.requests, limits: this.limits };

      this.$emit('input', {
        ...this.spec, resources, env, envFrom
      } );
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
  <div @input="update">
    <div class="row">
      <div class="col span-6">
        <slot name="entrypoint">
          <ShellInput
            v-model="spec.entrypoint"
            :mode="mode"
            label="Entrypoint"
            placeholder="e.g. /bin/sh"
          />
        </slot>
      </div>
      <div class="col span-6">
        <slot name="command">
          <ShellInput
            v-model="spec.command"
            :mode="mode"
            label="Command"
            placeholder="e.g. /usr/sbin/httpd -f httpd.conf"
          />
        </slot>
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="spec.workingDir"
          :mode="mode"
          label="Working Directory"
          placeholder="e.g. /myapp"
        />
      </div>
      <div class="col span-6">
        <div>
          <Checkbox v-model="spec.stdin" :mode="mode" type="checkbox" label="Interactive" @input="update" />

          <Checkbox v-model="spec.tty" :mode="mode" type="checkbox" label="TTY" @input="update" />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col span-3">
        <UnitInput
          v-model.number="requests.memory"
          :mode="mode"
          :input-exponent="2"
          label="Memory Reservation"
          placeholder="Default: None"
        />
      </div>
      <div class="col span-3">
        <UnitInput
          v-model="requests.cpu"
          :mode="mode"
          label="CPU Reservation"
          :input-exponent="-1"
          suffix="CPUs"
          placeholder="Default: None"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model="securityContext.runAsUser"
          :mode="mode"
          label="Run as User number"
          placeholder="e.g. 501"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model="securityContext.fsGroup"
          :mode="mode"
          label="Run as Group number"
          placeholder="e.g. 501"
        />
      </div>
    </div>

    <div class="spacer"></div>

    <KeyValue
      key="env"
      v-model="unreferencedValues"
      key-name="name"
      :mode="mode"
      :pad-left="false"
      :as-map="false"
      :read-allowed="false"
      title="Environment Variables"
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
    </KeyValue>
    <ValueFromResource
      v-for="(val,i) in referencedValues"
      ref="referenced"
      :key="`${i}`"
      :row="val"
      :all-secrets="secrets"
      :all-config-maps="configMaps"
      :mode="mode"
      @input="e=>updateRow(i, e.value, e.old)"
    />
    <button type="button" class="btn role-tertiary add mt-10" :disabled="mode==='view'" @click="addFromReference">
      Add from Resource
    </button>
  </div>
</template>
