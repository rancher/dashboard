<script>
import { RIO } from '@/config/types';

export default {
  props: {
    value: {
      type:     Array,
      default: () => {
        return [];
      }
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      default: () => {}
    },
  },
  data() {
    return { route: '' }
    ;
  },
  computed: {
    to() {
      return this.value[0].to
        ? this.value[0].to[0] : this.value[0].redirect;
    },
    remaining() {
      return this.value[0].to
        ? this.value[0].to.length - 1 : 0;
    }
  },
  created() {
    this.findEndpoint().then((route) => {
      this.route = route;
    });
  },
  methods: {
    async findEndpoint() {
      let route = '';

      if (this.value?.[0]?.to) {
        const destination = this.value[0].to[0];
        const services = await this.$store.dispatch('cluster/findAll', { type: RIO.SERVICE });
        let targetService;

        if (!destination.version) {
          // find service w/ this app and version
          targetService = services.filter((service) => {
            return service.spec.app === destination.app;
          })[0];
        } else {
          targetService = services.filter((service) => {
            return service.spec.app === destination.app && service.spec.version === destination.version;
          })[0];
        }

        if ( targetService ) {
          route = `/rio/services/${ targetService.id }` ;
        }
      } else if ( this.value?.[0]?.redirect ) {
        const {
          prefix, host, path, toHTTPS
        } = this.value[0].redirect;

        // format redirect as a url
        if (!host) {
          return;
        } else {
          route = `http${ toHTTPS ? 's' : '' }://${ prefix ? `${ prefix }.` : '' }${ host }/${ path }`;
        }
      }

      return route;
    }
  }
};
</script>

<template>
  <span v-if="to">
    <nuxt-link v-if="!value[0].redirect" :to="route">{{ to.app }}{{ to.version ?`(${to.version}): ` : ': ' }}{{ to.port }}</nuxt-link>
    <a v-else :href="route">
      {{ route }}
    </a>
    <br />
    <span v-if="remaining > 0" class="plus-more">+{{ remaining }} more</span>
  </span>
</template>

<style lang='scss'>
  .col-router-destination {
    color: var(--input-label)
  }
</style>
