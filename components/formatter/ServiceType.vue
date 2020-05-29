<script>
import { DEFAULT_SERVICE_TYPES } from '@/config/types';

export default {
  props: {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      default: () => {}
    },
  },
  data() {
    const { row } = this;
    let cloned = this.value.toLowerCase().slice();

    if (this.value === 'ClusterIP' && row?.spec?.clusterIP === 'None') {
      cloned = 'headless';
    }

    const match = DEFAULT_SERVICE_TYPES.find(s => s.id.toLowerCase() === cloned);
    const { translationLabel } = match;
    let translated;

    if (translationLabel && this.$store.getters['i18n/exists'](translationLabel)) {
      translated = this.$store.getters['i18n/t'](translationLabel);
    } else {
      translated = this.value;
    }

    return { translated };
  },
};
</script>>

<template>
  <span>{{ translated }}</span>
</template>
