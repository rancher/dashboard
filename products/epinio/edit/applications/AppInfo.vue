<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '@/products/epinio/models/applications.class';
import NameNsDescription from '@/components/form/NameNsDescription.vue';
import LabeledInput from '@/components/form/LabeledInput.vue';

import { EPINIO_TYPES } from '@/products/epinio/types';
import { sortBy } from '@/utils/sort';

interface Data {
  errors: string[],
  values: {
    nameNamespace: {
        name: string,
        namespace: string
    },
    instances: number
  }
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({

  components: {
    NameNsDescription,
    LabeledInput
  },

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

  data() {
    return {
      errors:        [],
      values: {
        nameNamespace: {
          name:      this.application.name,
          namespace: this.application.namespace
        },
        instances: this.application.instances || 1
      }
    };
  },

  watch: {
    'values.instances'() {
      this.update();
    },
  },

  computed: {
    namespaces() {
      return sortBy(this.$store.getters['epinio/all'](EPINIO_TYPES.NAMESPACE), 'name');
    },
  },

  methods: {
    update() {
      this.$emit('change', {
        name:      this.values.nameNamespace.name,
        namespace: this.values.nameNamespace.namespace,
        instances: this.values.instances
      });
    },
  },

});
</script>

<template>
  <div>
    <NameNsDescription
      name-key="name"
      namespace-key="namespace"
      :namespaces-override="namespaces"
      :description-hidden="true"
      :value="values.nameNamespace"
      :mode="mode"
      class="mt-10"
      @change="update"
    />
    <div class="col span-6">
      <LabeledInput
        v-model.number="values.instances"
        type="number"
        min="0"
        required
        :mode="mode"
        :label="t('epinio.applications.create.instances')"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>

</style>
