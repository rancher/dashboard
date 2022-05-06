<script>
import Vue from 'vue';

import LabeledInput from '@shell/components/form/LabeledInput';
import ShellInput from '@shell/components/form/ShellInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Checkbox from '@shell/components/form/Checkbox';
import EnvVars from '@shell/components/form/EnvVars';

export default {
  components: {
    LabeledInput,
    ShellInput,
    LabeledSelect,
    Checkbox,
    EnvVars,
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },
    configMaps: {
      type:    Array,
      default: () => [],
    },
    secrets: {
      type:    Array,
      default: () => [],
    },
    // container spec
    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },
  },

  data() {
    const {
      command,
      args,
      workingDir,
      stdin = false,
      stdinOnce = false,
      tty = false,
    } = this.value;

    return {
      args,
      command,
      commandOptions: ['No', 'Once', 'Yes'],
      stdin,
      stdinOnce,
      tty,
      workingDir,
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
        default:
          this.stdin = false;
          this.stdinOnce = false;
          this.tty = false;
          break;
        }
        this.update();
      },
    },
  },

  methods: {
    update() {
      const out = {
        stdin:      this.stdin,
        stdinOnce:  this.stdinOnce,
        command:    this.command,
        args:       this.args,
        workingDir: this.workingDir,
        tty:        this.tty,
      };

      for (const prop in out) {
        const val = out[prop];

        if (val === '' || typeof val === 'undefined' || val === null) {
          Vue.delete(this.value, prop);
        } else {
          Vue.set(this.value, prop, val);
        }
      }

      this.$emit('input', this.value);
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
            :placeholder="t('generic.placeholder', {text: '/bin/sh'}, true)"
          />
        </slot>
      </div>
      <div class="col span-6">
        <slot name="command">
          <ShellInput
            v-model="args"
            :mode="mode"
            :label="t('workload.container.command.args')"
            :placeholder="t('generic.placeholder', {text: '/usr/sbin/httpd -f httpd.conf'}, true)"
          />
        </slot>
      </div>
    </div>

    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput
          v-model="workingDir"
          :mode="mode"
          :label="t('workload.container.command.workingDir')"
          :placeholder="t('generic.placeholder', {text: '/myapp'}, true)"
        />
      </div>
      <div class="col span-6">
        <div :style="{ 'align-items': 'center' }" class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model="stdinSelect"
              :label="t('workload.container.command.stdin')"
              :options="commandOptions"
              :mode="mode"
            />
          </div>
          <div v-if="stdin" class="col span-6">
            <Checkbox
              v-model="tty"
              :mode="mode"
              :label="t('workload.container.command.tty')"
              @input="update"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="spacer"></div>
    <h3>{{ t('workload.container.titles.env') }}</h3>
    <EnvVars
      :mode="mode"
      :config-maps="configMaps"
      :secrets="secrets"
      :value="value"
    />
  </div>
</template>
