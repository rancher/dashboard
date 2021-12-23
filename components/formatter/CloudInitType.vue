<script>
import { mapGetters } from 'vuex';
import { HCI } from '@/config/labels-annotations';

export default {
  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    displayLabel() {
      return this.value?.[HCI.CLOUD_INIT] === 'user' ? this.t('harvester.cloudTemplate.userData') : this.t('harvester.cloudTemplate.networkData');
    }
  },
};
</script>

<template>
  <span> {{ displayLabel }} </span>
</template>
