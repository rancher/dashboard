<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '../../models/applications';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import Loading from '@shell/components/Loading.vue';

import { EPINIO_TYPES } from '../../types';
import { sortBy } from '@shell/utils/sort';
import { validateKubernetesName } from '@shell/utils/validators/kubernetes-name';

export interface EpinioAppInfo {
  meta: {
    name: string,
    namespace: string
  },
  configuration: {
    instances: number,
    environment: {},
    routes: string[]
  }
}

interface Data {
  errors: string[],
  values?: EpinioAppInfo
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({

  components: {
    ArrayList,
    NameNsDescription,
    LabeledInput,
    KeyValue,
    Loading
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
      errors: [],
      values: undefined
    };
  },

  mounted() {
    this.values = {
      meta: {
        name:      this.application.meta?.name,
        namespace: this.application.meta?.namespace || this.namespaces[0]?.metadata.name
      },
      configuration: {
        instances:   this.application.configuration?.instances || 1,
        environment: this.application.configuration?.environment || {},
        routes:      this.application.configuration?.routes || [],
      },
    };
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
      if (!this.values) {
        return false;
      }
      const validName = !!this.values.meta?.name;

      const nsErrors = validateKubernetesName(this.values.meta?.namespace || '', '', this.$store.getters, undefined, []);
      const validNamespace = nsErrors.length === 0;
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
  <Loading v-if="!values" />
  <div v-else>
    <div class="col">
      <NameNsDescription
        data-testid="epinio_app-info_name-ns"
        name-key="name"
        namespace-key="namespace"
        :namespaces-override="namespaces"
        :description-hidden="true"
        :value="values.meta"
        :mode="mode"
        @change="update"
        @createNamespace="ns => values.meta.namespace = ns"
      />
    </div>
    <div class="col span-6">
      <LabeledInput
        v-model.number="values.configuration.instances"
        data-testid="epinio_app-info_instances"
        type="number"
        min="0"
        required
        :mode="mode"
        :label="t('epinio.applications.create.instances')"
      />
    </div>
    <div class="spacer" />
    <div class="col span-8">
      <ArrayList
        v-model="values.configuration.routes"
        data-testid="epinio_app-info_routes"
        :title="t('epinio.applications.create.routes.title')"
        :protip="t('epinio.applications.create.routes.tooltip')"
        :mode="mode"
        :value-placeholder="t('epinio.applications.create.routes.placeholder')"
      />
    </div>
    <div class="spacer" />
    <div class="col span-8">
      <KeyValue
        v-model="values.configuration.environment"
        data-testid="epinio_app-info_envs"
        :mode="mode"
        :title="t('epinio.applications.create.envvar.title')"
        :key-label="t('epinio.applications.create.envvar.keyLabel')"
        :value-label="t('epinio.applications.create.envvar.valueLabel')"
        :parse-lines-from-file="true"
      />
    </div>
  </div>
</template>
