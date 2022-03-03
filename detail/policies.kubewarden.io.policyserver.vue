<script>
import { _CREATE } from '@/config/query-params';
import CreateEditView from '@/mixins/create-edit-view';

import ResourceTabs from '@/components/form/ResourceTabs';

export default {
  name: 'PolicyServer',

  components: { ResourceTabs },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:    String,
      default: _CREATE,
    },

    value: {
      type:     Object,
      required: true,
    }
  },
};
</script>

<template>
  <div>
    <div class="mb-20">
      <h3>{{ t('namespace.resources') }}</h3>
    </div>
    <ResourceTabs v-model="value" :mode="mode" />
  </div>
</template>
