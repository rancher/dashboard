<script>
import { Checkbox } from '@components/Form/Checkbox';
import { mapGetters } from 'vuex';

export default {
  components: { Checkbox },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'edit'
    }
  },
  created() {
    if (!this.value.global.cattle) {
      this.$set(this.value.global, 'cattle', { psp: { enabled: false } });
    }
    if (!this.value.global.cattle.psp) {
      this.$set(this.value.global.cattle, 'psp', { enabled: false });
    }
  },
  computed: { ...mapGetters({ t: 'i18n/t' }) }
};
</script>

<template>
  <Checkbox
    v-model="value.global.cattle.psp.enabled"
    :mode="mode"
    :label="t('catalog.chart.enablePSP')"
  />
</template>
