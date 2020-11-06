<script>
import PodAffinity from '@/components/form/PodAffinity';

export default {
  components: { PodAffinity },

  props:      {
    // pod template spec
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    mode: {
      type:    String,
      default: 'create'
    },
  },

  data() {
    const { affinity = {} } = this.value;
    const { podAffinity, podAntiAffinity } = affinity;

    return { podAffinity, podAntiAffinity };
  },

  methods: {
    update() {
      const { podAffinity, podAntiAffinity } = this;

      if (!this.value.affinity) {
        Object.assign(this.value, { affinity: { podAffinity, podAntiAffinity } });
      } else {
        Object.assign(this.value.affinity, { podAffinity, podAntiAffinity });
      }
    }
  }
};
</script>

<template>
  <div @input="update">
    <div>
      <h4 class="mb-10">
        <t k="workload.scheduling.affinity.affinityTitle" />
      </h4>
      <PodAffinity v-model="podAffinity" :mode="mode" />
    </div>
    <hr class="section-divider" />

    <h4 class="mb-10">
      <t k="workload.scheduling.affinity.antiAffinityTitle" />
    </h4>
    <PodAffinity v-model="podAntiAffinity" :mode="mode" />
  </div>
</template>
