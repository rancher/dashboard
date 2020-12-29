<script>
import { MANAGEMENT } from '@/config/types';
import SelectIconGrid from '@/components/SelectIconGrid';
import { sortBy } from '@/utils/sort';
import { MODE, _EDIT } from '@/config/query-params';

export default {
  components: { SelectIconGrid },

  async asyncData({ route, redirect, store }) {
    const rows = await store.dispatch(`management/findAll`, { type: MANAGEMENT.AUTH_CONFIG });
    const nonLocal = rows.filter(x => x.name !== 'local');
    const enabled = nonLocal.filter(x => x.enabled === true );

    if ( enabled.length === 1 ) {
      redirect({
        name:   'c-cluster-auth-config-id',
        params: { id: enabled[0].id }
      });

      return { nonLocal };
    } else {
      return { nonLocal };
    }
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
