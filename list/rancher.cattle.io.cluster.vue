<script>
import ResourceTable from '@/components/ResourceTable';
import Masthead from '@/components/ResourceList/Masthead';
import { REGISTER, _FLAGGED } from '@/config/query-params';

export default {
  components: { ResourceTable, Masthead },

  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    importLink() {
      return { query: { [REGISTER]: _FLAGGED } };
    }
  }
};
</script>

<template>
  <div>
    <Masthead
      :schema="schema"
      :resource="resource"
    >
      <template slot="extraActions">
        <n-link
          :to="importLink"
          class="btn role-primary"
        >
          {{ t('cluster.import') }}
        </n-link>
      </template>
    </Masthead>

    <ResourceTable :schema="schema" :rows="rows" />
  </div>
</template>
