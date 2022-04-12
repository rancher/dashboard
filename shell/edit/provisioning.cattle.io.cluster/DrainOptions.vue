<script>
import RadioGroup from '@shell/components/form/RadioGroup.vue';
import Checkbox from '@shell/components/form/Checkbox.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';

const DEFAULTS = {
  deleteEmptyDirData:              false, // Show; Kill pods using emptyDir volumes and lose the data
  disableEviction:                 false, // Hide; false = evict pods, true = delete pods
  enabled:                         false, // Show; true = Nodes must be drained before upgrade; false = YOLO
  force:                           false, // Show; true = Delete standalone pods, false = fail if there are any
  gracePeriod:                     -1, // Show; Pod shut down time, negative value uses pod default
  ignoreDaemonSets:                true, // Hide; true = work, false = never work because there's always daemonSets
  ignoreErrors:                    false, // Hide; profit?
  skipWaitForDeleteTimeoutSeconds: 0, // Hide; If the pod deletion time is older than this > 0, don't wait, for some reason
  timeout:                         120, // Show; Give up after this many seconds
};

export default {
  components: {
    RadioGroup, Checkbox, UnitInput
  },
  props:      {
    value: {
      type:    Object,
      default: () => {},
    },

    mode: {
      type:     String,
      required: true,
    }
  },

  data() {
    const out = {};

    for ( const k in DEFAULTS ) {
      if ( typeof this.value[k] === 'undefined' ) {
        out[k] = DEFAULTS[k];
      } else {
        out[k] = this.value[k];
      }
    }

    out.customGracePeriod = out.gracePeriod >= 0;
    out.customTimeout = out.timeout >= 0;

    return out;
  },

  methods: {
    update() {
      const out = {};

      for ( const k in DEFAULTS ) {
        out[k] = this[k];
      }

      if ( !this.customGracePeriod ) {
        out.gracePeriod = -1;
      }

      if ( !this.customTimeout ) {
        out.timeout = 0;
      }

      this.$emit('input', out);
    },
  },
};
</script>

<template>
  <div>
    <RadioGroup
      v-model="enabled"
      name="enabled"
      :options="[false, true]"
      :label="t('cluster.rke2.drain.label')"
      :labels="[t('generic.no'), t('generic.yes')]"
      :tooltip="t('cluster.rke2.drain.toolTip')"
      :mode="mode"
      @input="update"
    />

    <template v-if="enabled">
      <div class="mt-20">
        <Checkbox v-model="deleteEmptyDirData" label="Delete pods using emptyDir volumes" tooltip="emptyDir volumes are often used for ephemeral data, but the data will be permanently deleted.  Draining will fail if this is not set and there are pods using emptyDir." @input="update" />
      </div>
      <div><Checkbox v-model="force" label="Delete standalone pods" tooltip="Delete standalone pods which are not managed by a Workload controller (Deployment, Job, etc).  Draining will fail if this is not set and there are standalone pods." @input="update" /></div>
      <div>
        <Checkbox v-model="customGracePeriod" label="Override pod termination grace periods" @input="update" />
        <UnitInput
          v-if="customGracePeriod"
          v-model="gracePeriod"
          label="Grace Period"
          suffix="Seconds"
          class="mb-10"
          @input="update"
        />
      </div>
      <div>
        <Checkbox v-model="customTimeout" label="Timeout after" @input="update" />
        <UnitInput v-if="customTimeout" v-model="timeout" label="Drain Timeout" suffix="Seconds" @input="update" />
      </div>
    </template>
  </div>
</template>
