<script>
import { NODE } from '@/config/types';
import Tag from '@/components/Tag';

export default {
  props: {
    value: {
      type:     [Array, String],
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

  components: { Tag },

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
        let out ;

        try {
          out = JSON.parse(this.value);
          out.forEach((endpoint) => {
            let protocol = 'http';

            if (endpoint.port === 443) {
              protocol = 'https';
            }

            if (endpoint.addresses) {
              endpoint.link = `${ protocol }://${ endpoint.addresses[0] }:${ endpoint.port }`;
            } else if (externalIp) {
              endpoint.link = `${ protocol }://${ externalIp }:${ endpoint.port }`;
            } else {
              endpoint.display = `[${ this.t('servicesPage.anyNode') }]:${ endpoint.port }`;
            }
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
    <template v-for="endpoint in parsed">
      <Tag v-if="endpoint.display" :key="endpoint.display" class="endpoint-tag">{{ endpoint.display }}</Tag>
      <a
        v-else
        :key="endpoint.link"
        class="endpoint-tag"
        :href="endpoint.link"
        target="_blank"
        rel="nofollow noopener noreferrer"
      >
        <Tag v-if="endpoint.port">{{ endpoint.port }}/</Tag>{{ endpoint.protocol }}
      </a>
    </template>
  </span>
</template>

<style lang="scss" scoped>
.endpoint-tag {
  margin: 2px 4px 2px 0;
}
</style>
