<script>
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';
import { mapGetters } from 'vuex';

const DEFAULTS = {
  deleteEmptyDirData:              true, // Show; Kill pods using emptyDir volumes and lose the data
  disableEviction:                 false, // Hide; false = evict pods, true = delete pods
  enabled:                         false, // Show; true = Nodes must be drained before upgrade; false = YOLO
  force:                           false, // Show; true = Delete standalone pods, false = fail if there are any
  gracePeriod:                     -1, // Show; Pod shut down time, negative value uses pod default
  ignoreDaemonSets:                true, // Hide; true = work, false = never work because there's always daemonSets
  skipWaitForDeleteTimeoutSeconds: 0, // Hide; If the pod deletion time is older than this > 0, don't wait, for some reason
  timeout:                         120, // Show; Give up after this many seconds
};

export default {
  emits: ['update:value'],

  components: {
    RadioGroup, Checkbox, UnitInput
  },
  props: {
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

  created() {
    this.update();
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

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

      this.$emit('update:value', out);
    },
  },
};
</script>

<template>
  <div>
    <RadioGroup
      v-model:value="enabled"
      name="enabled"
      :options="[false, true]"
      :label="t('cluster.rke2.drain.label')"
      :labels="[t('generic.no'), t('generic.yes')]"
      :tooltip="t('cluster.rke2.drain.toolTip')"
      :mode="mode"
      @update:value="update"
    />

    <template v-if="enabled">
      <div class="mt-20">
        <Checkbox
          v-model:value="deleteEmptyDirData"
          label-key="cluster.rke2.drain.deleteEmptyDir.label"
          tooltip-key="cluster.rke2.drain.deleteEmptyDir.tooltip"
          @update:value="update"
        />
      </div>
      <div>
        <Checkbox
          v-model:value="force"
          label="Delete standalone pods"
          label-key="cluster.rke2.drain.force.label"
          tooltip="Delete standalone pods which are not managed by a Workload controller (Deployment, Job, etc).  Draining will fail if this is not set and there are standalone pods."
          tooltop-key="cluster.rke2.drain.force.tooltip"
          @update:value="update"
        />
      </div>
      <div>
        <Checkbox
          v-model:value="customGracePeriod"
          label-key="cluster.rke2.drain.gracePeriod.checkboxLabel"
          @update:value="update"
        />
        <UnitInput
          v-if="customGracePeriod"
          v-model:value="gracePeriod"
          label-key="cluster.rke2.drain.gracePeriod.inputLabel"
          :suffix="t('suffix.seconds', {count: timeout})"
          class="mb-10"
          @update:value="update"
        />
      </div>
      <div>
        <Checkbox
          v-model:value="customTimeout"
          label-key="cluster.rke2.drain.timeout.checkboxLabel"
          @update:value="update"
        />
        <UnitInput
          v-if="customTimeout"
          v-model:value="timeout"
          label-key="cluster.rke2.drain.timeout.inputLabel"
          :suffix="t('suffix.seconds', {count: timeout})"
          class="drain-timeout"
          @update:value="update"
        />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
  $drain-timeout-index: 18px;

  .drain-timeout {
    margin-top: 5px;
    margin-left: $drain-timeout-index;
    width: calc(100% - $drain-timeout-index);
  }
</style>
