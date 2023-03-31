<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '../../models/applications';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import Loading from '@shell/components/Loading.vue';
import Banner from '@components/Banner/Banner.vue';

import { EPINIO_TYPES } from '../../types';
import { sortBy } from '@shell/utils/sort';
import { validateKubernetesName } from '@shell/utils/validators/kubernetes-name';

export interface EpinioAppInfo {
  meta: {
    name: string,
    namespace: string
  },
  chart?: {},
  configuration: {
    configurations: string[],
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
    Loading,
    Banner
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
      chart:         this.moveBooleansToFront(this.application.chart?.settings) || {},
      configuration: {
        instances:   this.application.configuration?.instances || 1,
        environment: this.application.configuration?.environment || {},
        settings:    this.application.configuration?.settings || {},
        routes:      this.application.configuration?.routes || [],
      },
    };

    this.$emit('valid', this.valid);

    this.populateOnEdit();
  },

  watch: {
    'values.configuration.instances'() {
      this.update();
    },

    'values.configuration.environment'() {
      this.update();
    },

    'values.configuration.settings': {
      handler() {
        this.update();
      },
      deep: true
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
    },

    showApplicationVariables() {
      return Object.keys(this.values?.configuration?.settings).length !== 0;
    },

    disableInputs() {
      return this.mode === 'view';
    }
  },

  methods: {
    update() {
      this.$emit('change', {
        meta:          this.values.meta,
        configuration: {
          ...this.values.configuration,
          settings: this.objValuesToString(this.values.configuration.settings)
        },
      });
    },

    async populateOnEdit() {
      // We need to fetch the chart settings on edit mode.
      if (this.mode === 'edit' || this.mode === 'view') {
        const chartList = await this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.APP_CHARTS });

        const filterChart = chartList?.find((chart: any) => chart.id === this.application.configuration.appchart);

        if (filterChart?.settings ) {
          const customValues = Object.keys(filterChart?.settings).reduce((acc:any, key: any) => {
            acc[key] = this.application.configuration.settings[key] || '';

            return acc;
          }, {});

          this.values.configuration.settings = customValues;
          this.values.chart = this.moveBooleansToFront(filterChart.settings);
        }
      }
    },

    // Allows us to move the checkbox at the top of the list so layout-wise looks better
    moveBooleansToFront(settingsObj: any) {
      if (!settingsObj) {
        return;
      }
      const entries = Object.entries(settingsObj);

      entries.sort((a: any, b: any) => {
        const aValue = a[1].type === 'bool' ? 0 : 1;
        const bValue = b[1].type === 'bool' ? 0 : 1;

        return aValue - bValue;
      });

      return Object.fromEntries(entries);
    },

    objValuesToString(obj: any) {
      const copy = { ...obj };

      for (const key in copy) {
        if (typeof copy[key] !== 'string') {
          copy[key] = String(copy[key]);
        }
      }

      return copy;
    },
    placeholder(setting: any) {
      if (setting.type === 'bool') {
        return '';
      } else if (setting.type === 'numeric') {
        return this.numericPlaceholder(setting);
      } else if (setting.type === 'string') {
        return this.stringPlaceholder(setting);
      } else {
        return '';
      }
    },

    numericPlaceholder(setting: any) {
      if (setting.maximum && setting.minimum) {
        return `${ setting.minimum } - ${ setting.maximum }`;
      } else if (setting.maximum) {
        return `<= ${ setting.maximum }`;
      } else if (setting.minimum) {
        return `>= ${ setting.minimum }`;
      } else {
        return '';
      }
    }
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
        :create-namespace-override="true"
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
    <div
      v-if="showApplicationVariables"
      class="spacer"
    />
    <h3>{{ t('epinio.applications.create.settingsVars.title') }}</h3>
    <div
      v-if="showApplicationVariables"
      class="col span-8 settings"
    >
      <Banner
        v-if="mode === 'config'"
        color="info"
      >
        {{ t('epinio.applications.create.settingsVars.description') }}
      </Banner>

      <div
        v-for="(setting, key) in values.chart"
        :key="key"
        class="settings-item"
      >
        <label
          class="text-label"
          :for="key"
        >{{ key }}</label>
        <span v-if="setting.type === 'number' || setting.type === 'integer'">
          <input
            :id="key"
            v-model="values.configuration.settings[key]"
            type="number"
            :min="setting.minimum || 0"
            :max="setting.maximum || null"
            :placeholder="numericPlaceholder(setting)"
            :disabled="disableInputs"
          >
        </span>
        <span v-else-if="setting.type === 'bool'">
          <span class="settings-item-checkbox">
            <input
              :id="key"
              v-model="values.configuration.settings[key] "
              :disabled="disableInputs"
              type="checkbox"
            >
            <p>
              {{ t('epinio.applications.create.settingsVars.checkbox', {name: key}) }}
            </p>
          </span>
        </span>
        <span
          v-else-if="setting.type === 'string' && setting.enum"
        >
          <select
            :id="key"
            v-model="values.configuration.settings[key]"
            class="v-select"
            :disabled="disableInputs"
          >
            <option
              v-for="(option, index) in setting.enum"
              :key="option"
              :value="option"
              :selected="index === 0"
            >
              {{ option }}
            </option>
          </select>
        </span>
      </div>
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

<style lang="scss">
.settings {
  display: flex;
  flex-direction: column;

  &-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 20px;

    &-checkbox {
      display: flex;
      flex-direction: row;
      gap: 8px;
      align-items: center;
      margin-bottom: -10px;
    }
  }

  label {
    text-transform: capitalize;
  }

  input {
    height: 40px;
    line-height: 1;
  }

  input#checkbox {
    margin: 0;
  }
}
</style>
