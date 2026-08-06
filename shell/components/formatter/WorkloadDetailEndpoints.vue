<script>
import { NODE } from '@shell/config/types';
import Tag from '@shell/components/Tag';

export default {
  props: {
    value: {
      type:    [Array, String],
      default: null,
    },
  },

  components: { Tag },

  computed: {
    nodes() {
      return this.$store.getters['cluster/all'](NODE);
    },
    // value is either an array of endpoints or JSON from the "field.cattle.io/publicEndpoints"
    // annotation, which holds the same array
    parsed() {
      const nodes = this.nodes;
      const nodeWithExternal = nodes.find((node) => !!node.externalIp) || {};
      const externalIp = nodeWithExternal.externalIp;

      if ( this.value && this.value.length ) {
        let endpoints;

        try {
          endpoints = Array.isArray(this.value) ? this.value : JSON.parse(this.value);
        } catch (err) {
          return null;
        }

        return endpoints.map((endpoint) => {
          // The caller already knows the url, for example an endpoint resolved from the Gateway
          // API, where none of the rules below apply.
          if (endpoint.link) {
            return endpoint;
          }

          let protocol = 'http';

          if (endpoint.port === 443) {
            protocol = 'https';
          }

          const linkDefaultDisplay = endpoint.port ? `${ endpoint.port }/${ endpoint.protocol }` : endpoint.protocol;

          // If there's an ingress and it has a hostname, we use the hostname address instead
          // https://github.com/rancher/dashboard/issues/8087
          if (endpoint.ingressName && endpoint.hostname) {
            const link = `${ protocol }://${ endpoint.hostname }${ endpoint.path }`;

            return {
              ...endpoint, link, linkDisplay: link
            };
          } else if (endpoint.addresses && endpoint.addresses.length) {
            return {
              ...endpoint, link: `${ protocol }://${ endpoint.addresses[0] }:${ endpoint.port }`, linkDisplay: linkDefaultDisplay
            };
          } else if (externalIp) {
            return {
              ...endpoint, link: `${ protocol }://${ externalIp }:${ endpoint.port }`, linkDisplay: linkDefaultDisplay
            };
          }

          return { ...endpoint, display: `[${ this.t('servicesPage.anyNode') }]:${ endpoint.port }` };
        });
      }

      return null;
    }
  },
};
</script>

<template>
  <span>
    <template
      v-for="(endpoint, i) in parsed"
      :key="i"
    >
      <Tag
        v-if="endpoint.display"
        :key="endpoint.display"
        class="endpoint-tag"
      >{{ endpoint.display }}</Tag>
      <a
        v-else
        :key="endpoint.link"
        class="endpoint-link"
        :href="endpoint.link"
        target="_blank"
        rel="nofollow noopener noreferrer"
      >{{ endpoint.linkDisplay }}</a>
    </template>
  </span>
</template>

<style lang="scss" scoped>
.endpoint-tag {
  display: inline-block;
}
.endpoint-tag:not(:first-of-type) {
  margin: 2px 4px 0 2px;
}
.endpoint-link:after {
  content: ',\a0';
  display: inline-block;
  color: var(--default-text);
}
.endpoint-link:last-of-type:after {
  content: '';
}

</style>
