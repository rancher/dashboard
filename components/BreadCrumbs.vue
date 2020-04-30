<script>
import { MANAGEMENT } from '@/config/types';
import loadDeps from '@/mixins/load-deps';

export default {
  mixins: [loadDeps],
  data() {
    // make a map of all route names to validate programatically generated names
    const allRoutes = this.$router.options.routes;
    const allRouteMap = allRoutes.reduce((all, route) => {
      all[route.name] = route;

      return all;
    }, {});
    const { name, params } = this.$route;

    const crumbPieces = name.split('-');

    let crumbLocations = [];

    crumbPieces.forEach((piece, i) => {
      let nextName = piece;

      if (crumbLocations[i - 1]) {
        nextName = ( `${ crumbLocations[i - 1].name }-${ piece }`);
      }
      crumbLocations.push({
        name:   nextName,
        params: this.paramsFor(nextName, params)
      });
    });

    // remove root route 'c'
    crumbLocations.shift();

    // filter invalid routes
    crumbLocations = crumbLocations.filter((location) => {
      return (allRouteMap[location.name]);
    });

    return {
      crumbLocations, params, crumbPieces, allRouteMap, clusterName: ''
    };
  },

  methods: {
    async loadDeps() {
      const clusterID = this.params.cluster;
      const cluster = await this.$store.dispatch('management/find', { type: MANAGEMENT.CLUSTER, id: clusterID });

      if (cluster.nameDisplay) {
        this.clusterName = cluster.nameDisplay;
      } else {
        this.clusterName = clusterID;
      }
    },
    paramsFor(crumbName, params = this.params) {
      const pieces = crumbName.split('-');
      const out = {};

      pieces.forEach((piece) => {
        if (params[piece]) {
          out[piece] = params[piece];
        }
      });

      return out;
    },

    displayName(location, params = this.params) {
      const pieces = location.name.split('-');
      const lastPiece = pieces[pieces.length - 1];

      if (lastPiece === 'resource') {
        const resourceType = params[lastPiece];
        const schema = this.$store.getters['cluster/schemaFor'](resourceType);

        if (schema) {
          return this.$store.getters['type-map/pluralLabelFor'](schema);
        }
      } else if (lastPiece === 'cluster') {
        return this.clusterName;
      } else {
        return params[lastPiece];
      }
    },
  }
};
</script>

<template>
  <div class="row">
    <div v-for="(location, i) in crumbLocations" :key="location.name">
      <template v-if="displayName(location)">
        <span v-if="i > 0" class="divider">/</span>
        <span v-if="i===crumbLocations.length-1">{{ displayName(location) }}</span>
        <nuxt-link v-else :to="location">
          {{ displayName(location) }}
        </nuxt-link>
      </template>
    </div>
  </div>
</template>

<style>
    .breadcrumbs .divider {
        margin: 0px 5px 0px 5px
    }
</style>
