<script>
import ResourceTable from '@shell/components/ResourceTable.vue';
import Loading from '@shell/components/Loading.vue';
import Masthead from '@shell/components/Masthead.vue';
import { SCHEMA } from '@shell/config/types';
import { get } from '@shell/utils/object';
import { AGE } from '@shell/components/TableHeaders.vue';
import jsyaml from 'js-yaml';

export default {
  name: 'RolesIndex',

  components: {
    Loading,
    Masthead,
    ResourceTable
  },

  async fetch() {
    this.hasShadowEnabled = await this.$store.getters['cluster/haveAllResources']([SCHEMA])    
  },

  data() {
    const resource = 'management.cattle.io.role';

    return {
      resource,
      schema: SCHEMA,
      hasShadowEnabled: false,
    };
  },

  computed: {
    headers() {
      return [
        STATE, NAME, AGE
      ];
    },

    rows() {
      return this.$store.getters['cluster/all'](SCHEMA);
    },

    groupable() {
      return false;
    },
  },

  methods: {
    get,
  },

  // Override location details to match list page
  $context: {
    title: 'Roles',
    comment: 'roles'
  }
};
</script>

<template>
  <Loading v-if="!hasShadowEnabled" />
  <div v-else>
    <Masthead
      :resource="resource"
      :schema="schema"
    />
    <ResourceTable
      :schema="schema"
      :rows="rows"
      :groupable="groupable"
      :headers="headers"
      key-field="_key"
    />
  </div>
</template>
