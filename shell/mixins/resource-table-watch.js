import { STEVE_WATCH_MODE } from '@shell/types/store/subscribe.types';

// This is functionality used to stop or start sockets used to watch resources in the vai world.
// Currently disabled via (non-public) perf setting
// See https://github.com/rancher/dashboard/issues/14359 for long term plan

export default {
  props: {
    schema: {
      type:    Object,
      default: null,
    },
  },

  data() {
    // Note - does not cover anything fetched by secondary / page functions
    const watchOpts = this.schema?.id ? {
      type: this.schema.id,
      mode: STEVE_WATCH_MODE.RESOURCE_CHANGES
      // Note - we don't restrict watch by namespace (would involve unwatch, request, watch with new revision on every change to ns filter)
    } : undefined;

    return { watchOpts };
  },

  computed: {
    watching() {
      return this.$store.getters[`${ this.inStore }/watchStarted`](this.watchOpts);
    },
  },

  methods: {
    toggleWatch(toggle) {
      if (toggle) {
        // Assume there's a gap between cache and reality, to restart watch with something that will make a new http request to refresh it
        this.$store.dispatch(`${ this.inStore }/resyncWatch`, {
          ...this.watchOpts,
          resourceType: this.watchOpts?.type
        });
      } else {
        this.$store.dispatch(`${ this.inStore }/unwatch`, this.watchOpts);
      }
    }
  }
};
