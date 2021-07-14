<script>
import { allHash } from '@/utils/promise';
import { HCI } from '@/config/types';

export default {
  props: {
    value: {
      type:    String,
      default: ''
    }
  },

  async fetch() {
    const hash = await allHash({ harvesterSettings: this.$store.dispatch('virtual/findAll', { type: HCI.SETTING }) });

    this.harvesterSettings = hash.harvesterSettings;
  },

  data() {
    return { harvesterSettings: [] };
  },

  computed: {
    isMatch() {
      const harvesterSettings = this.$store.getters['virtual/all'](HCI.SETTING) || [];
      const resource = harvesterSettings.find( V => V.id === 'backup-target');

      return this.value === resource?.parseValue?.endpoint;
    }
  }
};
</script>

<template>
  <div v-if="isMatch">
    {{ value }}
  </div>
  <div v-else>
    {{ value }}
    <p v-if="value" class="text-error">
      {{ t('harvester.backUpPage.matchTarget') }}
    </p>
  </div>
</template>
