<script>
import { cleanUp } from '@/utils/object';
import LabeledInput from '@/components/form/LabeledInput';
import ShellInput from '@/components/form/ShellInput';
import KeyValue from '@/components/form/KeyValue';
import ValueFromResource from '@/components/form/ValueFromResource';
import LabeledSelect from '@/components/form/LabeledSelect';
import Checkbox from '@/components/form/Checkbox';

export default {
  components: {
    LabeledInput,
    ShellInput,
    KeyValue,
    ValueFromResource,
    LabeledSelect,
    Checkbox
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
    const {
      env = [], envFrom = [], command, args, workingDir, stdin = false, stdinOnce = false, tty = false
    } = this.value;

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
      env, envFrom, referencedValues, unreferencedValues, command, args, workingDir, stdin, stdinOnce, tty
    };
  },

  computed: {
    stdinSelect: {
      get() {
        if (this.stdin) {
          if (this.stdinOnce) {
            return 'Once';
          }

          return 'Yes';
        }
        if (this.stdinOnce) {
          return null;
        }

        return 'No';
      },
      set(neu) {
        switch (neu) {
        case 'Yes':
          this.stdin = true;
          this.stdinOnce = false;
          break;
        case 'Once':
          this.stdin = true;
          this.stdinOnce = true;
          break;
        case 'No':
          this.stdin = false;
          this.stdinOnce = false;
          this.tty = false;
          break;
        default:
          this.stdin = false;
          this.stdinOnce = true;
          this.tty = false;
        }
      }
    }
  },

  methods: {
    update() {
      // env should contain all unreferenced values and referenced values that refer to only part of a resource, ie contain 'valueFrom' key
      const env = [...this.unreferencedValues, ...this.referencedValues.filter(val => !!val.valueFrom)];
      const envFrom = this.referencedValues.filter(val => !!val.configmapRef || !!val.secretRef);

      const out = {
        ...this.value,
        ...cleanUp({
          stdin:      this.stdin,
          stdinOnce:  this.stdinOnce,
          command:    this.command,
          args:       this.args,
          workingDir: this.workingDir,
          tty:        this.tty,
          env,
          envFrom
        })
      };

      this.$emit('input', out );
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
            v-model="command"
            :mode="mode"
            :label="t('workload.container.command.command')"
            placeholder="e.g. /bin/sh"
          />
        </slot>
      </div>
      <div class="col span-6">
        <slot name="command">
          <ShellInput
            v-model="args"
            :mode="mode"
            :label="t('workload.container.command.args')"
            placeholder="e.g. /usr/sbin/httpd -f httpd.conf"
          />
        </slot>
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="workingDir"
          :mode="mode"
          :label="t('workload.container.command.workingDir')"
          placeholder="e.g. /myapp"
        />
      </div>
      <div class="col span-6">
        <div class="row">
          <div class="col span-6">
            <LabeledSelect v-model="stdinSelect" label="Stdin" :options="[, 'No', 'Once', 'Yes']" :mode="mode" />
          </div>
          <div class="col span-6">
            <Checkbox v-model="tty" :disabled="!stdin" label="TTY" />
          </div>
        </div>
      </div>
    </div>
    <div class="row">
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
    <div v-if="referencedValues.length" class="value-from headers">
      <span>Type</span>
      <span>Source</span>
      <span>Key</span>
      <span />
      <span>Prefix or Alias</span>
    </div>
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
    <button v-show="mode!=='view'" type="button" class="btn role-tertiary add mt-10" @click="addFromReference">
      <t k="workload.container.command.addFromResource" />
    </button>
  </div>
</template>

<style lang='scss'>
  .value-from {
    display:grid;
    grid-template-columns: 20% 25% 25% 5% 15% auto;
    grid-column-gap:10px;
    margin-bottom:10px;

    &.headers>* {
      padding:0px 10px 0px 10px;
      color: var(--input-label);
      align-self: end;
    }
    & :not(.headers){
      align-self:center;
    }

    & .labeled-input.create INPUT[type='text']{
      padding: 9px 0px 9px 0px !important
    }

    & BUTTON{
      padding:0px;
    }
  }
</style>
