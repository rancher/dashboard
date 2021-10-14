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
    return { errors: [] };
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    valid() {
      return false;
    },
  },
  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  methods: {
    willSave() {

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
      :mode="mode"
      :done-route="doneRoute"
      :resource="value"
      :can-yaml="false"
      :errors="errors"
      :valid="valid"
      @error="(e) => (errors = e)"
      @finish="save"
      @cancel="done"
    >
      <LabeledInput
        v-model="value.name"
        class="col span-6"
        :label="t('epinio.namespaceName')"
        :mode="mode"
        :required="true"
      />
    </CruResource>
  </div>
</template>
