<script lang="ts">
import Vue, { PropType } from 'vue';
import CreateEditView from '@/mixins/create-edit-view';
import Loading from '@/components/Loading.vue';
import CruResource from '@/components/CruResource.vue';
import Namespace from '@/products/epinio/models/namespaces.class';
import LabeledInput from '@/components/form/LabeledInput.vue';
import { mapGetters } from 'vuex';

export default Vue.extend({
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
      type:     Object as PropType<Namespace>,
      required: true,
    },
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    valid() {
      return false;
    },
  },
});
</script>

<template>
  <Loading v-if="!value" />
  <CruResource
    v-else
    :mode="mode"
    :resource="value"
    :can-yaml="false"
    :errors="errors"
    @error="(e) => (errors = e)"
  >
    <LabeledInput
      v-model="value.name"
      :label="t('epinio.namespaceName')"
      :mode="mode"
      :required="true"
    />
    <div>
      <br /><br />
      Debug<br />
      Mode: {{ mode }}<br />
      Value: {{ JSON.stringify(value) }}<br />
      originalValue: {{ JSON.stringify(originalValue) }}<br />
    </div>
  </CruResource>
</template>
