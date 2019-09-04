<script>
import ButtonGroup from '@/components/ButtonGroup';
import { mapPref, THEME, KEYMAP } from '@/store/prefs';
import { ucFirst } from '@/utils/string';

const KEYMAP_LABELS = {
  sublime: 'Normal human',
  emacs:   'Emacs',
  vim:     'Vim',
};

export default {
  components: { ButtonGroup },

  computed:   {
    theme:  mapPref(THEME),
    keymap: mapPref(KEYMAP),

    themeOptions() {
      return this.$store.getters['prefs/options'](THEME).map((value) => {
        return {
          label: ucFirst(value),
          value
        };
      });
    },

    keymapOptions() {
      return this.$store.getters['prefs/options'](KEYMAP).map((value) => {
        return {
          label: KEYMAP_LABELS[value] || ucFirst(value),
          value
        };
      });
    }
  },
};
</script>

<template>
  <div>
    <h1>Preferences</h1>

    <h6>Theme</h6>
    <ButtonGroup v-model="theme" :options="themeOptions" />

    <h6>YAML Editor Mode</h6>
    <ButtonGroup v-model="keymap" :options="keymapOptions" />
  </div>
</template>

<style lang="scss" scoped>
  h1 {
    margin: 0;
  }

  h6 {
    margin: 20px 0 0 0;

    &:first-of-type {
      margin-top: 0;
    }
  }
</style>
