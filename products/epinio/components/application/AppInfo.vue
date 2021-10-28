<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '@/products/epinio/models/applications.class';
import NameNsDescription from '@/components/form/NameNsDescription.vue';
import LabeledInput from '@/components/form/LabeledInput.vue';
import KeyValue from '@/components/form/KeyValue.vue';

import { EPINIO_TYPES } from '@/products/epinio/types';
import { sortBy } from '@/utils/sort';

interface Data {
  errors: string[],
  values: {
    meta: {
      name: string,
      namespace: string
    },
    configuration: {
      instances: number,
      environment: {}
    }
  }
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({

  components: {
    NameNsDescription,
    LabeledInput,
    KeyValue
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
        meta: {
          name:      this.application.meta?.name,
          namespace: this.application.meta?.namespace
        },
        configuration: {
          instances:   this.application.configuration?.instances || 1,
          environment:   this.application.configuration?.environment || {}
        },
      }
    };
  },

  watch: {
    'values.configuration.instances'() {
      this.update();
    },

    'values.configuration.environment'() {
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
        meta:          this.values.meta,
        configuration: this.values.configuration,
      });
    },

  },

});
</script>

<template>
  <div>
    <div class="col">
      <NameNsDescription
        name-key="name"
        namespace-key="namespace"
        :namespaces-override="namespaces"
        :description-hidden="true"
        :value="values.meta"
        :mode="mode"
        @change="update"
      />
    </div>
    <div class="col span-6">
      <LabeledInput
        v-model.number="values.configuration.instances"
        type="number"
        min="0"
        required
        :mode="mode"
        :label="t('epinio.applications.create.instances')"
      />
    </div>
    <div class="spacer"></div>
    <div class="col span-8">
      <KeyValue
        v-model="values.configuration.environment"
        :mode="mode"
        :title="t('epinio.applications.create.envvar.title')"
        :key-label="t('epinio.applications.create.envvar.keyLabel')"
        :value-label="t('epinio.applications.create.envvar.valueLabel')"
      />
    </div>
  </div>
</template>
