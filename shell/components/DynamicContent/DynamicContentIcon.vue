<script setup lang="ts">
import { useStore } from 'vuex';
import { computed } from 'vue';

type AnnouncementIcon = {
  light: string;
  dark: string;
}

type KeyValues = {
  [key: string]: string;
};

const ICON_FORMAT = /(@|#|>)/;

const props = defineProps<{icon: AnnouncementIcon}>();
const store = useStore();
const theme = computed(() => store.getters['prefs/theme']);

const icon = computed(() => {
  const decodedIcon = props.icon.light.split(ICON_FORMAT);

  if (decodedIcon[0].startsWith('!')) {
    return `icon-${ decodedIcon[0].substring(1) }`;
  }

  return undefined;
});

const src = computed(() => {
  const decodedIcon = props.icon.light.split(ICON_FORMAT);
  const icon = decodedIcon[0].substring(1);

  const themePrefix = theme.value === 'dark' ? 'dark/' : '';

  try {
    return require(`~shell/assets/images/content/${ themePrefix }${ icon }`);
  } catch {
    return require(`~shell/assets/images/content/${ icon }`);
  }
});

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
    v-if="icon"
    class="icon"
    :style="style"
    :class="icon"
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
