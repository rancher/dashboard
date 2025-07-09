<script>
import { DEFAULT_SERVICE_TYPES } from '@shell/models/service';

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
      type:    Object,
      default: () => {}
    },
  },

  computed: {
    translated() {
      const value = this.value;

      return this.getLabel(value.toLocaleLowerCase());
    },
    clusterIp() {
      return this.row?.spec?.clusterIP;
    },
    headless() {
      return this.value === 'ClusterIP' && this.clusterIp === 'None' ? this.getLabel('headless') : undefined;
    }
  },

  methods: {
    getLabel(type) {
      const match = DEFAULT_SERVICE_TYPES.find((s) => s.id.toLowerCase() === type);
      const translationLabel = match?.label;
      let translated;

      if (translationLabel && this.$store.getters['i18n/exists'](translationLabel)) {
        translated = this.$store.getters['i18n/t'](translationLabel);
      } else {
        translated = this.value;
      }

      return translated;
    }
  }
};
</script>

<template>
  <span>{{ translated }}{{ headless ? ` (${headless})` : '' }}</span>
</template>
