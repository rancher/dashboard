<script lang='ts'>
import { mapGetters, Store } from 'vuex';
import { defineComponent } from 'vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import FormValidation from '@shell/mixins/form-validation';
import Loading from '@shell/components/Loading.vue';

export default defineComponent({
  name:       'CruCAPA',
  components: { CruResource, Loading },
  mixins:     [CreateEditView, FormValidation],
  props:      {
    mode: {
      type:    String,
      default: _CREATE
    },

    // v2 provisioning cluster object
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  async fetch() {

  },
  computed: {
    fetchState(): {pending: boolean} {
      return this.$fetchState;
    },
  }
});
</script>
<template>
  <Loading v-if="fetchState.pending" />

  <CruResource
    v-else
    ref="cruresource"
    :resource="value"
    :mode="mode"
    :can-yaml="false"
    :done-route="doneRoute"
    :errors="fvUnreportedValidationErrors"
    :validation-passed="fvFormIsValid"
    @error="e=>errors=e"
    @finish="save"
    @cancel="done"
  />
</template>
