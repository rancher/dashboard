<script>
import { MANAGEMENT } from '@/config/types';
import SelectIconGrid from '@/components/SelectIconGrid';
import { sortBy } from '@/utils/sort';
import { MODE, _EDIT } from '@/config/query-params';
import { authProviders } from '@/pages/c/_cluster/auth/config/auth-config-utils';

export default {
  components: { SelectIconGrid },

  async asyncData({ store, redirect }) {
    const authProvs = await authProviders(store);

    if (!!authProvs.enabledLocation) {
      redirect(authProvs.enabledLocation);
    }

    return { nonLocal: authProvs.nonLocal };
  },

  data() {
    const resource = MANAGEMENT.AUTH_CONFIG;
    const getters = this.$store.getters;
    const inStore = getters['currentProduct'].inStore;
    const hasListComponent = getters['type-map/hasCustomList'](resource);
    const hasEditComponent = getters['type-map/hasCustomEdit'](resource);
    const schema = getters[`${ inStore }/schemaFor`](resource);

    return {
      resource,
      schema,
      hasListComponent,
      hasEditComponent,

      // Provided by asyncData later
      nonLocal: null,
    };
  },

  computed: {
    rows() {
      return sortBy(this.nonLocal, ['sideLabel', 'nameDisplay']);
    },
  },

  methods: {
    colorFor(row) {
      const types = ['ldap', 'oauth', 'saml'];

      const idx = types.indexOf(row.configType);

      if ( idx === -1 ) {
        return 'color8';
      }

      return `color${ idx + 1 }`;
    },

    goTo(id) {
      this.$router.push({
        name:   'c-cluster-auth-config-id',
        params: { id },
        query:  { [MODE]: _EDIT }
      });
    }
  }
};
</script>

<template>
  <div>
    <SelectIconGrid
      :rows="rows"
      :color-for="colorFor"
      name-field="nameDisplay"
      @clicked="(row) => goTo(row.id)"
    />
  </div>
</template>
