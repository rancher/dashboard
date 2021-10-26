<script>
import CreateEditView from '@/mixins/create-edit-view';
import Loading from '@/components/Loading.vue';
import CruResource from '@/components/CruResource.vue';
import LabeledInput from '@/components/form/LabeledInput.vue';
import { mapGetters } from 'vuex';
import { validateKubernetesName } from '@/utils/validators/kubernetes-name';

export default {
  components: {
    Loading,
    CruResource,
    LabeledInput,
  },
  mixins: [CreateEditView],

  data() {
    return {
      errors:           [],
      validFields: { name: false }
    };
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    validationPassed() {
      return !Object.values(this.validFields).includes(false);
    }
  },

  methods: {
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

    setValid(field, valid) {
      this.validFields[field] = valid;
    },

  }
};
</script>

<template>
  <div class="row">
    <Loading v-if="!value" />
    <CruResource
      v-else
      class="col span-6"
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
      <LabeledInput
        v-model="value.name"
        :label="t('epinio.namespace.name')"
        :mode="mode"
        :required="true"
        :validators="[ meetsNameRequirements ]"
        @setValid="setValid('name', $event)"
      />
    </CruResource>
  </div>
</template>
