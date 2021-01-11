<script>
import ResourceTable from '@/components/ResourceTable';
import {
  RBAC_BUILTIN, RBAC_DEFAULT, STATE, NAME, AGE
} from '@/config/table-headers';

export default {
  name:       'ListRoletemplate',
  components: { ResourceTable },

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
      required: true,
    },
  },

  computed: {
    headers() {
      return [
        STATE,
        NAME,
        RBAC_BUILTIN,
        RBAC_DEFAULT,
        AGE
      ];
    },
  },
};
</script>

<template>
  <ResourceTable
    v-bind="$attrs"
    :schema="schema"
    :headers="headers"
    :rows="rows"
    :groupable="true"
    group-by="subtypeDisplay"
    :group-sort="['subtypeSort', 'subtype']"
    group-tooltip="resourceTable.groupBy.project"
    key-field="_key"
    v-on="$listeners"
  />
</template>
