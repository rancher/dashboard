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
      errors:           [],
      namespaces:       [],
      touchedName:      false,
      touchedData:      false,
      nameErrorMessage: '',
      dataErrorMessage: '',
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
      // Separate field validity from the error messages
      // so that submit button can be disabled before the form is submitted
      return this.touchedName && this.nameErrorMessage.length === 0;
    },
  },

  async fetch() {
    this.namespaces = await this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.NAMESPACE });
    this.value.data = { ...this.initialValue.configuration.details };
    this.validFields.name = this.isEdit;
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
    updateNameErrors(): void {
      this.touchedName = true;
      const nameErrors = this.getNameErrors(this.value.metadata.name || '');
      const nameErrorMessage = nameErrors.join(', ');

      this.nameErrorMessage = nameErrorMessage;
    },
    updateDataErrors(): void {
      this.touchedData = true;

      const keys = Object.keys(this.value.data || {});

      alert(JSON.stringify(this.value));
      // if (keys.length === 0) {
      //   const atLeastOneKeyRequired = this.t(
      //     'epinio.services.pairs.requirement'
      //   );
      //   this.dataErrorMessage = atLeastOneKeyRequired;
      //   return;
      // }
      if (keys.includes('')) {
        const keyCannotBeEmpty = this.t('epinio.services.pairs.empty');

        this.dataErrorMessage = keyCannotBeEmpty;

        return;
      }
      const regex = /^[a-zA-Z0-9_\-\.]*$/gm;
      const keyHasInvalidChars = this.t('epinio.services.pairs.characters');

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        if (!key.match(regex)) {
          this.dataErrorMessage = keyHasInvalidChars;

          return;
        }
      }
      this.dataErrorMessage = '';
    },
    getNameErrors(name: string): string[] {
      return validateKubernetesName(
        this.value.metadata.name,
        this.t('epinio.namespace.name'),
        this.$store.getters,
        undefined,
        []
      );
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
        :error-messages="nameErrorMessage"
        @change="updateNameErrors"
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
            :parse-lines-from-file="true"
            :error-messages="dataErrorMessage"
            @updateErrors="updateDataErrors"
          />
        </div>
      </div>
    </CruResource>
  </div>
</template>
