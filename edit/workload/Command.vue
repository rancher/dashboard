<script>
import { get } from '../../utils/object';
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

    // Object.keys(limits).forEach((resource) => {
    //   limits[resource] = parseSi(limits[resource]);
    // });
    // Object.keys(requests).forEach((resource) => {
    //   requests[resource] = parseSi(requests[resource]);
    // });

    return {
      spec, env, envFrom, limits, requests, securityContext
    };
  },

  computed: {
    referencedValues: {
      get() {
        const all = [...this.env, ...this.envFrom];

        return all.filter((val) => {
          return !!val.valueFrom || !!val.secretRef;
        });
      },
      set(neu) {
        this.envFrom = neu.filter(val => !!val.secretRef);
        this.env = [...this.unreferencedValues, ...neu.filter(val => !val.secretRef)];
      }
    },

    unreferencedValues: {
      get() {
        return this.env.filter((val) => {
          return !val.valueFrom;
        });
      },
      set(neu) {
        const referenced = this.env.filter(val => val.valueFrom);

        this.$set(this, 'env', [...neu, ...referenced]);
      }
    }
  },

  methods: {
    update() {
      // this.$set(this.spec, 'env', this.env);
      // this.$set(this.spec, 'envFrom', this.envFrom);
      const { env, envFrom } = this;
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
      this.env.push({ name: '', valueFrom: {} });

      this.$nextTick(() => {
        const newRow = this.$refs.referenced[this.referencedValues.length - 1];
        const input = get(newRow, '$refs.typeSelect.$refs.input');

        if (input) {
          input.open = true;
        }
      });
    }
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
          />
        </slot>
      </div>
      <div class="col span-6">
        <slot name="command">
          <ShellInput
            v-model="spec.command"
            :mode="mode"
            label="Command"
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
        />
      </div>
      <div class="col span-6 pt-10">
        <div>
          <Checkbox v-model="spec.stdin" :mode="mode" type="checkbox" label="Interactive" />

          <Checkbox v-model="spec.tty" :mode="mode" type="checkbox" label="TTY" />
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
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model="securityContext.fsGroup"
          :mode="mode"
          label="Run as Group number"
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
      :key="`${Object.values(val)}-${i}`"
      :row="val"
      :all-secrets="secrets"
      :all-config-maps="configMaps"
      :namespace="namespace"
      :mode="mode"
      @input="e=>updateRow(i, e.value, e.old)"
    />
    <button type="button" class="btn btn-sm role-primary" :disabled="mode==='view'" @click="addFromReference">
      Add from Resource
    </button>
  </div>
</template>
