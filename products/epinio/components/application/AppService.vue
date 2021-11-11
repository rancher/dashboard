<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '@/products/epinio/models/applications';

import { EPINIO_TYPES } from '@/products/epinio/types';
import { sortBy } from '@/utils/sort';
import LabeledSelect from '@/components/form/LabeledSelect.vue';
import EpinioService from '@/products/epinio/models/services';

interface Data {
  values: string[]
}
export default Vue.extend<Data, any, any, any>({
  components: { LabeledSelect },

  props: {
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
    await this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.SERVICE });
  },

  data() {
    return { values: this.application.configuration.services };
  },

  computed: {
    services() {
      const list = this.$store.getters['epinio/all'](EPINIO_TYPES.SERVICE)
        .filter((s: EpinioService) => s.metadata.namespace === this.application.metadata.namespace)
        .map((s: EpinioService) => ({
          label: s.metadata.name,
          value: s.metadata.name,
        }));

      return sortBy(list, 'label');
    },

    noServices() {
      return !this.$fetchState.pending && !this.services.length;
    }
  },

  watch: {
    values() {
      this.$emit('change', this.values);
    },

    noServices(neu) {
      if (neu && this.values.length) {
        // Selected services are no longer valid
        this.values = [];
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
      :disabled="noServices"
      :options="services"
      :searchable="true"
      :mode="mode"
      :multiple="true"
      :label="t('typeLabel.services', { count: 2})"
      :placeholder="noServices ? t('epinio.applications.steps.services.select.placeholderNoOptions') : t('epinio.applications.steps.services.select.placeholderWithOptions')"
    />
  </div>
</template>

<style lang='scss' scoped>
.labeled-select {
  min-height: 79px;
}
</style>
