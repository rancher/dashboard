<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import CommunityLinks from '@shell/components/CommunityLinks.vue';
import SimpleBox from '@shell/components/SimpleBox.vue';
import { processLink } from '@shell/plugins/clean-html';
import type { WidgetSpec } from '../../templating/types';

// LINKS — the Home's Links box.
//
// Two sources, chosen in the widget's settings:
//   home    Rancher's own list — Docs / Forums / Slack / File an Issue / Get Started / SUSE
//           Application Collection — through the SAME component the stock Home uses, including
//           anything an admin has customised through the ui-custom-links setting.
//   custom  your own labels and URLs, in the same box: SimpleBox, the same heading, the same rows.
//
// Custom links are not handed to CommunityLinks. It runs every label it is given through i18n, as a
// translation key, and a label that is not a key comes back as `%label%` - which is how every custom
// link used to render. So the box is drawn here, from the same pieces, with the label as written.
//
// A custom URL is stored in a ConfigMap that more people can write than will click it, so only
// ordinary destinations become links: http(s), mailto, and paths inside Rancher. Anything else - a
// `javascript:` URL above all - is shown as text, never as something to click.

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const { t } = useI18n(store);

const SAFE_URL = /^(https?:\/\/|mailto:|\/(?!\/))/i;

const custom = computed(() => props.widget.source === 'custom' && (props.widget.links || []).some((l) => l.label && l.url));

const links = computed(() => (props.widget.links || [])
  .filter((l) => l.label && l.url)
  .map((l) => {
    const url = l.url.trim();
    const safe = SAFE_URL.test(url);

    return {
      label:    l.label,
      internal: safe && url.startsWith('/'),
      href:     safe ? processLink(url) : null,
    };
  }));
</script>

<template>
  <SimpleBox v-if="custom">
    <template #title>
      <h2>{{ widget.title || t('customLinks.displayTitle') }}</h2>
    </template>
    <div
      v-for="(link, i) in links"
      :key="i"
      class="support-link"
    >
      <router-link
        v-if="link.internal && link.href"
        :to="link.href"
        role="link"
        :aria-label="link.label"
      >
        {{ link.label }}
      </router-link>
      <a
        v-else-if="link.href"
        :href="link.href"
        rel="noopener noreferrer nofollow"
        target="_blank"
        role="link"
        :aria-label="link.label"
      >{{ link.label }}</a>
      <span v-else>{{ link.label }}</span>
    </div>
  </SimpleBox>
  <CommunityLinks v-else />
</template>

<style lang="scss" scoped>
// Match the stock Home, where the box title is 16px and the links are 15px apart.
:deep(h2) {
  align-items: center;
  display:     flex;
  font-size:   16px;
}

:deep(.support-link:not(:last-child)) {
  margin-bottom: 15px;
}
</style>
