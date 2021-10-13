<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '@/products/epinio/models/applications.class';
import NameNsDescription from '@/components/form/NameNsDescription.vue';
import LabeledInput from '@/components/form/LabeledInput.vue';
import EnvVars from '@/components/form/EnvVars.vue';

import { EPINIO_TYPES } from '@/products/epinio/types';
import { sortBy } from '@/utils/sort';

interface Data {
  errors: string[],
  values: {
    nameNamespace: {
        name: string,
        namespace: string
    },
    instances: number,
    envvars: {}
  }
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({

  components: {
    NameNsDescription,
    LabeledInput,
    EnvVars
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
        instances: this.application.instances || 1,
        envvars:   { env: this.application.envvars }
      }
    };
  },

  watch: {
    'values.instances'() {
      this.update();
    },

    'values.envvars'() {
      this.update();
    }
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
        instances: this.values.instances,
        envvars:   this.values.envvars.env
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
        :value="values.nameNamespace"
        :mode="mode"
        @change="update"
      />
    </div>
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
    <div class="spacer"></div>
    <div class="col span-8">
      <EnvVars
        :mode="mode"
        :value="values.envvars"
        :config-maps="[]"
        :secrets="[]"
        single-type="single"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>

</style>
