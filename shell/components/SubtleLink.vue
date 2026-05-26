<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouteLocationRaw } from 'vue-router';

export interface Props {
  to?: RouteLocationRaw;
  href?: string;
  target?: string;
  openInNewTabLabel?: string;
}

const props = defineProps<Props>();

const isExternal = computed(() => !!props.href);
</script>

<template>
  <component
    :is="isExternal ? 'a' : RouterLink"
    class="subtle-link link-main secondary-text-link"
    v-bind="isExternal
      ? { href, target, rel: target === '_blank' ? 'noopener noreferrer nofollow' : undefined }
      : { to }"
  >
    <span
      v-if="openInNewTabLabel"
      class="sr-only"
    >{{ openInNewTabLabel }}</span>
    <slot name="default" /><span v-if="openInNewTabLabel">&nbsp;</span><i
      v-if="openInNewTabLabel"
      class="link-icon icon icon-external-link"
    />
  </component>
</template>

<style lang="scss" scoped>
.subtle-link {
    text-decoration: underline;
    color: var(--body-text);

    &:hover,
    &:active {
      text-decoration: none;
    }
}

.link-icon {
  display: inline;
}
</style>
