<script>
import { get } from '@shell/utils/object';
import { ISTIO } from '@shell/config/types';
import { mapGetters } from 'vuex';
export default {
  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    row: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  computed: {
    gateways() {
      const out = [];
      const gateways = get(this.value, 'gateways');
      const httpMatches = (get(this.value, 'http') || []).reduce((matches, httpRoute) => {
        if (httpRoute.match) {
          matches.push(...httpRoute.match);

          return matches;
        }
      }, []);
      const tlsMatches = (get(this.value, 'tls') || []).reduce((matches, tlsRoute) => {
        if (tlsRoute.match) {
          matches.push(...tlsRoute.match);

          return matches;
        }
      }, []);

      if (gateways) {
        out.push(...gateways);
      }

      if (httpMatches && typeof httpMatches === 'object') {
        httpMatches.forEach((matchBlock) => {
          if (matchBlock.gateways) {
            out.push(...matchBlock.gateways);
          }
        });
      }

      if (tlsMatches && typeof tlsMatches === 'object') {
        tlsMatches.forEach((matchBlock) => {
          if (matchBlock.gateways) {
            out.push(...matchBlock.gateways);
          }
        });
      }

      return out;
    },
    ...mapGetters({ t: 'i18n/t' })
  },

  methods: {
    gatewayLinks(name) {
      let namespace;

      if (!name.includes('/')) {
        namespace = get(this.row, 'metadata.namespace') || 'istio-system';
      } else {
        [namespace, name] = name.split('/');
      }
      const routeParams = this.$route.params;
      const routeName = 'c-cluster-product-resource-namespace-id';
      const params = {
        ...routeParams,
        product:  'istio',
        resource: ISTIO.GATEWAY,
        namespace,
        id:       name
      };

      return { name: routeName, params };
    }
  }
};
</script>

<template>
  <span>
    <span
      v-for="(gateway, i) in gateways"
      :key="i"
    >
      <template v-if="i < 5">
        <router-link :to="gatewayLinks(gateway)">
          {{ gatewayLinks(gateway).params.id }}
        </router-link>
        <span v-if="i<gateways.length-1 && i < 4">,</span>
      </template>
    </span>
    <span
      v-if="gateways.length>7"
      class="text-muted"
    >
      {{ t('generic.plusMore', {n: gateways.length-4}) }}
    </span>
  </span>
</template>
