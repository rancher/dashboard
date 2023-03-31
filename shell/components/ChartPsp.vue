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
    },

    /**
     * Optional title section prior checkbox
     */
    title: {
      type:    String,
      default: null
    },

    /**
     * Cluster information
     */
    cluster: {
      type:    Object,
      default: null
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
  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    /**
     * Display checkbox only if contains PSP or K8S version is less than 1.25
     */
    hasCheckbox() {
      const clusterVersion = this.cluster?.kubernetesVersion || '';
      const version = clusterVersion.match(/\d+/g);
      const isRequiredVersion = version?.length ? +version[0] === 1 && +version[1] < 25 : false;

      return isRequiredVersion;
    }
  }
};
</script>

<template>
  <div
    v-if="hasCheckbox"
    class="mt-10 mb-10"
  >
    <h3 v-if="title">
      {{ title }}
    </h3>

    <Checkbox
      v-model="value.global.cattle.psp.enabled"
      data-testid="psp-checkbox"
      :mode="mode"
      :label="t('catalog.chart.enablePSP')"
    />
  </div>
</template>
