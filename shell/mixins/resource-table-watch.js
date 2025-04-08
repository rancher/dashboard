import { STEVE_WATCH_MODE } from '@shell/types/store/subscribe.types';

// Ideally this functionality should be in PaginatedResourceTable, however that
// hasn't been adopted by a LOT of places. So separate out logic here to move there
// eventually

export default {
  props: {
    schema: {
      type:    Object,
      default: null,
    },
  },

  data() {
    // TODO: RC table tweaks: does not cover anything fetched secondary / page resources

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
        // TODO: RC table tweaks: BUG - hit refresh whilst toggle off... findAll will watch again

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
