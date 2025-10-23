<script setup lang="ts">
/**
 * Icon component to render an icon from the icon data in an announcement
 */

import { useStore } from 'vuex';
import { computed } from 'vue';

import { AnnouncementNotificationIconData } from '@shell/utils/dynamic-content/types';

type KeyValues = {
  [key: string]: string;
};

const ICON_FORMAT = /(@|#|>)/;

const props = defineProps<{icon: AnnouncementNotificationIconData}>();
const store = useStore();
const theme = computed(() => store.getters['prefs/theme']);

/**
 * Get the correct url to use for light/dark mode
 */
const url = computed(() => {
  const darkTheme = theme.value === 'dark';

  return darkTheme ? props.icon?.dark || props.icon?.light : props.icon?.light;
});

const iconName = computed(() => {
  const decodedIcon = url.value.split(ICON_FORMAT);

  if (decodedIcon[0].startsWith('!')) {
    return `icon-${ decodedIcon[0].substring(1) }`;
  }

  return undefined;
});

/**
 * Get the src value for an image tag
 */
const src = computed(() => {
  const decodedIcon = url.value.split(ICON_FORMAT);

  // If the icon name starts with ~, then it references a built-in icon/image
  if (decodedIcon[0].startsWith('~')) {
    const img = decodedIcon[0].substring(1);
    const themePrefix = theme.value === 'dark' ? 'dark/' : '';

    try {
      return require(`~shell/assets/images/content/${ themePrefix }${ img }`);
    } catch {
      return require(`~shell/assets/images/content/${ img }`);
    }
  }

  // Regular URL, use it directly
  return decodedIcon[0];
});

/**
 * Icon value can include some custom style information:
 *
 * '@wxh' (or @w) To change the width/height
 * '>x' to set the padding to x px
 * '<x' to set the margin to x px
 * '#rrggbb' to set the color
 *
 */
const style = computed(() => {
  const decodedIcon = props.icon.light.split(ICON_FORMAT).slice(1);
  const OPTIONS: { [key: string]: (v: string, result: KeyValues) => void } = {
    '@': (v: string, result: KeyValues) => {
      const wh = v.split('x');

      result.width = `${ wh[0] }px`;
      result.height = (wh.length === 2) ? `${ wh[1] }px` : `${ wh[0] }px`;
      result.fontSize = result.width;
    },
    '#': (v: string, result: KeyValues) => {
      result.color = `#${ v }`;
    },
    '>': (v: string, result: KeyValues) => {
      result.padding = `${ v }px`;
    },
    '<': (v: string, result: KeyValues) => {
      result.margin = `${ v }px`;
    }
  };

  const pairs = Math.floor(decodedIcon.length / 2);
  const result = {};

  for (let i = 0; i < pairs; i++) {
    const index = 2 * i;

    if (OPTIONS[decodedIcon[index]]) {
      const handler = OPTIONS[decodedIcon[index]];
      const value = decodedIcon[index + 1];

      if (handler) {
        handler(value, result);
      }
    }
  }

  return result;
});

</script>
<template>
  <i
    v-if="iconName"
    class="icon"
    :style="style"
    :class="iconName"
  />
  <img
    v-else
    :style="style"
    :src="src"
    class="dc-icon"
  >
</template>

<style lang="scss" scoped>
  .dc-icon {
    width: 48px;
    height: 48px;
  }
</style>
