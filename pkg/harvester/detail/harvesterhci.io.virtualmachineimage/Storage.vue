<script>
import LabelValue from '@shell/components/LabelValue';

export default {
  props: {
    value: {
      type:    Object,
      default: () => {}
    },
  },

  components: { LabelValue },

  computed: {
    migratable() {
      return this.value.migratable === 'true' ? this.t('generic.yes') : this.t('generic.no');
    },
  },
};
</script>

<template>
  <div>
    <div
      v-if="value.nodeSelector"
      class="row mb-20"
    >
      <div class="col span-12">
        <LabelValue
          :name="t('harvester.storage.nodeSelector.label')"
          :value="value.nodeSelector"
        />
      </div>
    </div>
    <div
      v-if="value.diskSelector"
      class="row mb-20"
    >
      <div class="col span-12">
        <LabelValue
          :name="t('harvester.storage.diskSelector.label')"
          :value="value.diskSelector"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabelValue
          :name="t('harvester.storage.migratable.label')"
          :value="migratable"
        />
      </div>
      <div class="col span-6">
        <LabelValue
          :name="t('harvester.storage.numberOfReplicas.label')"
          :value="value.numberOfReplicas"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabelValue
          :name="t('harvester.storage.staleReplicaTimeout.label')"
          :value="value.staleReplicaTimeout"
        />
      </div>
    </div>
  </div>
</template>
