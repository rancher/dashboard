<script lang="ts">
import Vue, { PropType } from 'vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import { mapGetters } from 'vuex';
import EpinioConfiguration from '../models/configurations';
import { EPINIO_TYPES } from '../types';
import KeyValue from '@shell/components/form/KeyValue.vue';
import { epinioExceptionToErrorsArray } from '../utils/errors';
import { validateKubernetesName } from '@shell/utils/validators/kubernetes-name';
import { sortBy } from '@shell/utils/sort';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Banner from '@components/Banner/Banner.vue';
import EpinioBindAppsMixin from './bind-apps-mixin.js';

interface Data {
}

export default Vue.extend<Data, any, any, any>({
  components: {
    Loading,
    CruResource,
    NameNsDescription,
    KeyValue,
    Banner,
    LabeledSelect
  },

  mixins: [CreateEditView, EpinioBindAppsMixin],

  props: {
    mode: {
      type:     String,
      required: true
    },
    value: {
      type:     Object as PropType<EpinioConfiguration>,
      required: true
    },
    initialValue: {
      type:     Object as PropType<EpinioConfiguration>,
      required: true
    }
  },

  async fetch() {
    await this.mixinFetch();

    Vue.set(this.value.meta, 'namespace', this.initialValue.meta.namespace || this.namespaces[0]?.metadata.name);
    this.selectedApps = [...this.initialValue.configuration?.boundapps || []];
  },

  data() {
    Vue.set(this.value, 'data', { ...this.initialValue.configuration?.details });

    return {
      errors:           [],
      selectedApps:     [],
      validationPassed: false
    };
  },

  mounted() {
    this.updateValidation();
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    namespaces() {
      return sortBy(this.$store.getters['epinio/all'](EPINIO_TYPES.NAMESPACE), 'name');
    },

  },

  methods: {
    async save(saveCb: (success: boolean) => void) {
      this.errors = [];
      try {
        if (this.isCreate) {
          await this.value.create();
          await this.updateConfigurationAppBindings();
          await this.$store.dispatch('epinio/findAll', { type: this.value.type, opt: { force: true } });
        }

        if (this.isEdit) {
          await this.value.update();
          await this.updateConfigurationAppBindings();
          await this.value.forceFetch();
        }

        saveCb(true);
        this.done();
      } catch (err) {
        this.errors = epinioExceptionToErrorsArray(err);
        saveCb(false);
      }
    },

    setData(data: any[]) {
      Vue.set(this.value, 'data', data);
    },

    updateValidation() {
      const nameErrors = validateKubernetesName(this.value?.meta.name || '', this.t('epinio.namespace.name'), this.$store.getters, undefined, []);
      const nsErrors = validateKubernetesName(this.value?.meta.namespace || '', '', this.$store.getters, undefined, []);

      if (nameErrors.length === 0 && nsErrors.length === 0) {
        const dataValues = Object.entries(this.value?.data || {});

        if (!!dataValues.length) {
          Vue.set(this, 'validationPassed', true);

          return;
        }
      }

      Vue.set(this, 'validationPassed', false);
    }

  },

  watch: {
    'value.meta.namespace'() {
      Vue.set(this, 'selectedApps', []);
      this.updateValidation(); // For when a user is supplying their own ns
    },

    'value.meta.name'() {
      this.updateValidation();
    },

    'value.data': {
      deep: true,

      handler(neu) {
        this.updateValidation();
      }
    }
  }
});
</script>

<template>
  <Loading v-if="!value || $fetchState.pending" />
  <CruResource
    v-else-if="value"
    :min-height="'7em'"
    :mode="mode"
    :done-route="doneRoute"
    :resource="value"
    :can-yaml="false"
    :errors="errors"
    :validation-passed="validationPassed"
    namespace-key="meta.namespace"
    @error="(e) => (errors = e)"
    @finish="save"
    @cancel="done"
  >
    <Banner
      v-if="value.isServiceRelated"
      color="info"
    >
      {{ t('epinio.configurations.tableHeaders.service.tooltip') }}
    </Banner>
    <NameNsDescription
      name-key="name"
      namespace-key="namespace"
      :namespaces-override="namespaces"
      :description-hidden="true"
      :value="value.meta"
      :mode="mode"
    />
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="selectedApps"
          :loading="$fetchState.pending"
          :disabled="noApps"
          :options="nsAppOptions"
          :searchable="true"
          :mode="mode"
          :multiple="true"
          :label-key="'epinio.configurations.bindApps.label'"
          :placeholder="noApps ? t('epinio.configurations.bindApps.placeholderNoOptions') : t('epinio.configurations.bindApps.placeholderWithOptions')"
        />
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-11">
        <KeyValue
          :value="value.data"
          :initial-empty-row="true"
          :mode="mode"
          :title="t('epinio.configurations.pairs.label')"
          :title-protip="t('epinio.configurations.pairs.tooltip')"
          :key-label="t('epinio.applications.create.envvar.keyLabel')"
          :value-label="t('epinio.applications.create.envvar.valueLabel')"
          :parse-lines-from-file="true"
          @input="setData($event)"
        />
      </div>
    </div>
  </CruResource>
</template>
