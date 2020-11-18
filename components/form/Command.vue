<script>
import { cleanUp } from '@/utils/object';
import LabeledInput from '@/components/form/LabeledInput';
import ShellInput from '@/components/form/ShellInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Checkbox from '@/components/form/Checkbox';
import EnvVars from '@/components/form/EnvVars';

export default {
  components: {
    LabeledInput,
    ShellInput,
    LabeledSelect,
    Checkbox,
    EnvVars
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },
    configMaps: {
      type:     Array,
      default: () => []

    },
    secrets: {
      type:     Array,
      default: () => []
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
      command, args, workingDir, stdin = false, stdinOnce = false, tty = false
    } = this.value;

    return {
      command, args, workingDir, stdin, stdinOnce, tty
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
      }
    }
  },

  methods: {
    update() {
      const out = {
        ...this.value,
        ...cleanUp({
          stdin:      this.stdin,
          stdinOnce:  this.stdinOnce,
          command:    this.command,
          args:       this.args,
          workingDir: this.workingDir,
          tty:        this.tty,
        })
      };

      this.$emit('input', out );
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

    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput
          v-model="workingDir"
          :mode="mode"
          :label="t('workload.container.command.workingDir')"
          placeholder="e.g. /myapp"
        />
      </div>
      <div class="col span-6">
        <div :style="{'align-items':'center'}" class="row">
          <div class="col span-6">
            <LabeledSelect v-model="stdinSelect" :label="t('workload.container.command.stdin')" :options="['No', 'Once', 'Yes']" :mode="mode" />
          </div>
          <div v-if="stdin" class="col span-6">
            <Checkbox v-model="tty" :mode="mode" label="TTY" @input="update" />
          </div>
        </div>
      </div>
    </div>
    <div class="spacer"></div>
    <h3>{{ t('workload.container.titles.env') }}</h3>
    <EnvVars :mode="mode" :config-maps="configMaps" :secrets="secrets" :value="value" />
  </div>
</template>
