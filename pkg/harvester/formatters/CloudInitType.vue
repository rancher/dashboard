<script>
import { HCI } from '@shell/config/labels-annotations';
import { mapGetters } from 'vuex';

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
