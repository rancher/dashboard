<script>
import { NODE } from '@shell/config/types';

export default {
  props: {
    value: {
      type:    [Array, String],
      default: null,
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      required: true
    },
  },

  computed: {
    nodes() {
      return this.$store.getters['cluster/all'](NODE);
    },
    // value may be JSON from "field.cattle.io/publicEndpoints" label
    parsed() {
      const nodes = this.nodes;
      const nodeWithExternal = nodes.find(node => !!node.externalIp) || {};
      const externalIp = nodeWithExternal.externalIp;

      if ( this.value && this.value.length ) {
        const out = [];

        try {
          const endpoints = JSON.parse(this.value);

          endpoints.forEach((endpoint) => {
            let protocol = 'http';
            let display = '';
            let link = '';
            const addresses = endpoint.addresses;

            if (endpoint.port === 443) {
              protocol = 'https';
            }

            if (addresses && addresses.length) {
              addresses.forEach((address) => {
                out.push({
                  display:  `${ address }:${ endpoint.port }`,
                  link:     `${ protocol }://${ address }:${ endpoint.port }`,
                  protocol: endpoint?.protocol ? `/${ endpoint.protocol }` : '',
                });
              });

              return;
            } else if (externalIp) {
              link = `${ protocol }://${ externalIp }:${ endpoint.port }`;
            } else {
              display = `[${ this.t('servicesPage.anyNode') }]:${ endpoint.port }`;
            }

            out.push({
              display,
              link,
              protocol: endpoint?.protocol ? `/${ endpoint.protocol }` : '',
            });
          });

          return out;
        } catch (err) {
          return this.value[0];
        }
      }

      return null;
    },

    protocol() {
      const { parsed } = this;

      if ( parsed) {
        if (this.parsed[0].protocol) {
          return this.parsed[0].protocol;
        }

        const match = parsed.match(/^([^:]+):\/\//);

        if ( match ) {
          return match[1];
        } else {
          return 'link';
        }
      }

      return null;
    }
  },
};
</script>

<template>
  <span>
    <template v-for="(endpoint, index) in parsed">
      <span
        v-if="endpoint.display"
        :key="endpoint.display + endpoint.protocol"
        class="block"
      >
        {{ endpoint.display }}{{ endpoint.protocol }}
      </span>
      <a
        v-else
        :key="index + endpoint.link"
        class="block"
        :href="endpoint.link"
        target="_blank"
        rel="nofollow noopener noreferrer"
      >
        <span v-if="endpoint.port">{{ endpoint.port }}/</span>{{ endpoint.protocol }}
      </a>
    </template>
  </span>
</template>
