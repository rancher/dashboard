<script>
import CreateEditView from '@/mixins/create-edit-view';
import Loading from '@/components/Loading.vue';
import CruResource from '@/components/CruResource.vue';
import LabeledInput from '@/components/form/LabeledInput.vue';
import { mapGetters } from 'vuex';

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
      enableSaveButton: false
    };
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  methods: {
    willSave() {

    },
    validateNamespaceName(name = '') {
      // Must consist of lower case alphanumeric characters or
      // ‘-‘, and must start and end with an alphanumeric character
      // (e.g. ‘my-name’, or ‘123-abc’
      if (!(name.match(/^[a-z0-9][a-z\-0-9]*[a-z0-9]+$/) )) {
        return {
          isValid:      false,
          errorMessage: this.t('epinio.namespaceName.validation.characters')
        };
      }

      return { isValid: true };
    }
  }
};
</script>

<template>
  <!-- :valid="false" -->
  <div class="row">
    <Loading v-if="!value" />
    <CruResource
      v-else
      class="col span-6"
      :mode="mode"
      :done-route="doneRoute"
      :resource="value"
      :can-yaml="false"
      :errors="errors"
      :enable-save-button="enableSaveButton"
      @error="(e) => (errors = e)"
      @finish="save"
      @cancel="done"
    >
      <LabeledInput
        v-model="value.name"
        :label="t('epinio.namespaceName.name')"
        :mode="mode"
        :required="true"
        :validators="[ validateNamespaceName ]"
        @disableSubmitButton="enableSaveButton = false"
        @enableSubmitButton="enableSaveButton = true"
      />
    </CruResource>
  </div>
</template>
