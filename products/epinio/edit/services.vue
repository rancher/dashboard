<script lang="ts">
import Vue, { PropType } from 'vue';
import CreateEditView from '@/mixins/create-edit-view';
import Loading from '@/components/Loading.vue';
import CruResource from '@/components/CruResource.vue';
import NameNsDescription from '@/components/form/NameNsDescription.vue';
import { mapGetters } from 'vuex';
import ServiceModel from '@/products/epinio/models/services';
import { EPINIO_TYPES } from '@/products/epinio/types';
import KeyValue from '@/components/form/KeyValue.vue';
import { epinioExceptionToErrorsArray } from '@/products/epinio/utils/errors';
import { validateKubernetesName } from '@/utils/validators/kubernetes-name';

interface Data {
}

export default Vue.extend<Data, any, any, any>({
  components: {
    Loading,
    CruResource,
    NameNsDescription,
    KeyValue
  },
  mixins: [CreateEditView],

  data() {
    return {
      errors:        [],
      namespaces:    [],
      validFields:     { name: false },
    };
  },

  props: {
    mode: {
      type:     String,
      required: true
    },
    value: {
      type:     Object as PropType<ServiceModel>,
      required: true
    },
    initialValue: {
      type:     Object as PropType<ServiceModel>,
      required: true
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    validationPassed() {
      return !Object.values(this.validFields).includes(false);
    },
  },

  async fetch() {
    this.namespaces = await this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.NAMESPACE });
  },

  methods: {
    async save(saveCb: (success: boolean) => void) {
      this.errors = [];
      try {
        if (this.mode === 'create') {
          await this.value.create();
          await this.$store.dispatch('epinio/findAll', { type: this.value.type, opt: { force: true } });
        }

        if (this.mode === 'edit') {
          await this.value.update();
          await this.value.forceFetch();
        }
        saveCb(true);
        this.done();
      } catch (err) {
        this.errors = epinioExceptionToErrorsArray(err);
        saveCb(false);
      }
    },
    setValid(field: string, valid: boolean) {
      this.validFields[field] = valid;
    },
    meetsNameRequirements( name = '') {
      const nameErrors = validateKubernetesName(name, this.t('epinio.namespace.name'), this.$store.getters, undefined, []);

      if (nameErrors.length > 0) {
        return {
          isValid:      false,
          errorMessage: nameErrors.join(', ')
        };
      }

      return { isValid: true };
    },
  }
});
</script>

<template>
  <div>
    <Loading v-if="!value || namespaces.length === 0" />
    <CruResource
      v-if="value && namespaces.length > 0"
      :min-height="'7em'"
      :mode="mode"
      :done-route="doneRoute"
      :resource="value"
      :can-yaml="false"
      :errors="errors"
      :validation-passed="validationPassed"
      @error="(e) => (errors = e)"
      @finish="save"
      @cancel="done"
    >
      <NameNsDescription
        name-key="name"
        namespace-key="namespace"
        :namespaces-override="namespaces"
        :description-hidden="true"
        :value="value.metadata"
        :mode="mode"
        :min-height="90"
        :validators="[ meetsNameRequirements ]"
        @setValid="setValid('name', $event)"
      />

      <div class="row">
        <div class="col span-11">
          <KeyValue
            v-model="value.data"
            :initial-empty-row="true"
            :mode="mode"
            :title="t('epinio.services.pairs.label')"
            :title-protip="t('epinio.services.pairs.tooltip')"
            :key-label="t('epinio.applications.create.envvar.keyLabel')"
            :value-label="t('epinio.applications.create.envvar.valueLabel')"
          />
        </div>
      </div>
    </CruResource>
  </div>
</template>
<style>
</style>
