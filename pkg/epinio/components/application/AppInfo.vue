<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '../../models/applications';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import LabeledInput from '@shell/components/form/LabeledInput.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';

import { EPINIO_TYPES } from '../../types';
import { sortBy } from '@shell/utils/sort';

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
    ArrayList,
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
          environment: this.application.configuration?.environment || {},
          routes:      this.application.configuration?.routes || [],
        },
      }
    };
  },

  mounted() {
    this.$emit('valid', this.valid);
  },

  watch: {
    'values.configuration.instances'() {
      this.update();
    },

    'values.configuration.environment'() {
      this.update();
    },

    'values.configuration.routes'() {
      this.update();
    },

    valid() {
      this.$emit('valid', this.valid);
    }
  },

  computed: {
    namespaces() {
      return sortBy(this.$store.getters['epinio/all'](EPINIO_TYPES.NAMESPACE), 'name');
    },

    valid() {
      const validName = !!this.values.meta?.name;
      const validNamespace = !!this.values.meta?.namespace;
      const validInstances = typeof this.values.configuration?.instances !== 'string' && this.values.configuration?.instances >= 0;

      return validName && validNamespace && validInstances;
    }
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
      <ArrayList
        v-model="values.configuration.routes"
        :title="t('epinio.applications.create.routes.title')"
        :protip="t('epinio.applications.create.routes.tooltip')"
        :mode="mode"
        :value-placeholder="t('epinio.applications.create.routes.placeholder')"
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
        :parse-lines-from-file="true"
      />
    </div>
  </div>
</template>
