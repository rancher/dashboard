<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '../../models/applications';

import { EpinioConfiguration, EPINIO_TYPES } from '../../types';
import { sortBy } from '@shell/utils/sort';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

interface Data {
  values: string[]
}
export default Vue.extend<Data, any, any, any>({
  components: { LabeledSelect },

  props: {
    initialApplication: {
      type:     Object as PropType<Application>,
      default: () => ({}),
    },
    application: {
      type:     Object as PropType<Application>,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },

  async fetch() {
    await this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.CONFIGURATION });
  },

  data() {
    return { values: [] };
  },

  computed: {
    configurations() {
      const list = this.$store.getters['epinio/all'](EPINIO_TYPES.CONFIGURATION)
        .filter((s: EpinioConfiguration) => s.metadata.namespace === this.application.metadata.namespace)
        .map((s: EpinioConfiguration) => ({
          label: s.metadata.name,
          value: s.metadata.name,
        }));

      return sortBy(list, 'label');
    },

    noConfigs() {
      return !this.$fetchState.pending && !this.configurations.length;
    },

    hasConfigs() {
      return !this.$fetchState.pending && !!this.configurations.length;
    }
  },

  watch: {
    values() {
      this.$emit('change', this.values);
    },

    noConfigs(neu, old) {
      if (neu && this.values?.length) {
        // Selected configurations are no longer valid
        this.values = [];
      }
    },

    hasConfigs(neu, old) {
      if (!old && neu) {
        if (!!this.initialApplication?.configuration?.configurations) {
          this.values = this.initialApplication.configuration.configurations?.filter((cc: string) => this.configurations.find((c: any) => c.value === cc)) || [];
        }
      }
    }

  },
});

</script>

<template>
  <div class="col span-6">
    <LabeledSelect
      v-model="values"
      :loading="$fetchState.pending"
      :disabled="noConfigs"
      :options="configurations"
      :searchable="true"
      :mode="mode"
      :multiple="true"
      :label="t('typeLabel.configurations', { count: 2})"
      :placeholder="noConfigs ? t('epinio.applications.steps.configurations.select.placeholderNoOptions') : t('epinio.applications.steps.configurations.select.placeholderWithOptions')"
    />
  </div>
</template>

<style lang='scss' scoped>
.labeled-select {
  min-height: 79px;
}
</style>
