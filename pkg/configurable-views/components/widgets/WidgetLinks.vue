<script>
import CommunityLinks from '@shell/components/CommunityLinks.vue';

// LINKS — Rancher's own links box.
//
// This is deliberately the SAME component the stock Home uses, not a lookalike: the box, the title,
// the spacing and the external-link handling are Rancher's, so the widget is indistinguishable from
// the Links panel people already know.
//
// Two sources, chosen in the widget's settings:
//   home    Rancher's own list — Docs / Forums / Slack / File an Issue / Get Started / SUSE
//           Application Collection — exactly as the Home shows it, including anything an admin has
//           customised through the ui-custom-links setting. Nothing to configure.
//   custom  your own labels and URLs. CommunityLinks takes these through `linkOptions`, so even a
//           hand-written list renders in the same box.
export default {
  name:       'WidgetLinks',
  components: { CommunityLinks },

  props: {
    widget: {
      type:    Object,
      default: () => ({}),
    },
  },

  computed: {
    useOwnLinks() {
      return this.widget.source === 'custom' && this.links.length > 0;
    },

    links() {
      return (this.widget.links || []).filter((link) => link.label && link.url);
    },

    // CommunityLinks' own shape for a supplied list: { <label>: <url> }. It runs each key through
    // i18n and falls back to the key itself, which is what lets a plain label through unchanged.
    linkOptions() {
      return this.useOwnLinks ? Object.fromEntries(this.links.map((l) => [l.label, l.url])) : {};
    },
  },
};
</script>

<template>
  <CommunityLinks :link-options="linkOptions" />
</template>

<style lang="scss" scoped>
// Match the stock Home, where the box title is 16px and the links are 15px apart.
:deep(h2) {
  font-size: 16px;
}

:deep(.support-link:not(:last-child)) {
  margin-bottom: 15px;
}
</style>
