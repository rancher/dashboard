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
    // value may be JSON from "field.cattle.io/publicEndpoints" label
    parsed() {
      const nodes = this.nodes;
      const nodeWithExternal = nodes.find((node) => !!node.externalIp) || {};
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

            const linkDefaultDisplay = endpoint.port ? `${ endpoint.port }/${ endpoint.protocol }` : endpoint.protocol;

            // If there's an ingress and it has a hostname, we use the hostname address instead
            // https://github.com/rancher/dashboard/issues/8087
            if (endpoint.ingressName && endpoint.hostname) {
              endpoint.link = `${ protocol }://${ endpoint.hostname }${ endpoint.path }`;
              endpoint.linkDisplay = endpoint.link;
            } else if (endpoint.addresses && endpoint.addresses.length) {
              endpoint.link = `${ protocol }://${ endpoint.addresses[0] }:${ endpoint.port }`;
              endpoint.linkDisplay = linkDefaultDisplay;
            } else if (externalIp) {
              endpoint.link = `${ protocol }://${ externalIp }:${ endpoint.port }`;
              endpoint.linkDisplay = linkDefaultDisplay;
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
