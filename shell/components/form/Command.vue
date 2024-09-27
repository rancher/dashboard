<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import ShellInput from '@shell/components/form/ShellInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Checkbox } from '@components/Form/Checkbox';
import EnvVars from '@shell/components/form/EnvVars';

export default {
  emits: ['update:value'],

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
    loading: {
      default: false,
      type:    Boolean
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
          delete this.value[prop];
        } else {
          this.value[prop] = val;
        }
      }

      this.$emit('update:value', this.value);
    },
  },
};
</script>
<template>
  <div>
    <div class="row">
      <div
        class="col span-6"
        data-testid="input-command-command"
      >
        <slot name="entrypoint">
          <ShellInput
            v-model:value="command"
            :mode="mode"
            :label="t('workload.container.command.command')"
            :placeholder="t('generic.placeholder', {text: '/bin/sh'}, true)"
            @update:value="update"
          />
        </slot>
      </div>
      <div
        class="col span-6"
        data-testid="input-command-args"
      >
        <slot name="command">
          <ShellInput
            v-model:value="args"
            :mode="mode"
            :label="t('workload.container.command.args')"
            :placeholder="t('generic.placeholder', {text: '/usr/sbin/httpd -f httpd.conf'}, true)"
            @update:value="update"
          />
        </slot>
      </div>
    </div>

    <div class="row mt-20">
      <div
        class="col span-6"
        data-testid="input-command-workingDir"
      >
        <LabeledInput
          v-model:value="workingDir"
          :mode="mode"
          :label="t('workload.container.command.workingDir')"
          :placeholder="t('generic.placeholder', {text: '/myapp'}, true)"
          @update:value="update"
        />
      </div>
      <div class="col span-6">
        <div
          :style="{ 'align-items': 'center' }"
          class="row"
        >
          <div
            class="col span-6"
            data-testid="input-command-stdin"
          >
            <LabeledSelect
              v-model:value="stdinSelect"
              :label="t('workload.container.command.stdin')"
              :options="commandOptions"
              :mode="mode"
              @update:value="update"
            />
          </div>
          <div
            v-if="stdin"
            class="col span-6"
            data-testid="input-command-tty"
          >
            <Checkbox
              v-model:value="tty"
              :mode="mode"
              :label="t('workload.container.command.tty')"
              @update:value="update"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="spacer" />
    <h3>{{ t('workload.container.titles.env') }}</h3>
    <EnvVars
      :mode="mode"
      :config-maps="configMaps"
      :secrets="secrets"
      :value="value"
      :loading="loading"
    />
  </div>
</template>
