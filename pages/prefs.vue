<script>
import day from 'dayjs';
import ButtonGroup from '@/components/ButtonGroup';
import {
  mapPref, THEME, KEYMAP, DEV, DATE_FORMAT, TIME_FORMAT, ROWS_PER_PAGE
} from '@/store/prefs';
import { ucFirst } from '@/utils/string';
import LabeledSelect from '@/components/form/LabeledSelect';

const KEYMAP_LABELS = {
  sublime: 'Normal human',
  emacs:   'Emacs',
  vim:     'Vim',
};

export default {
  components: { ButtonGroup, LabeledSelect },
  computed:   {
    theme:      mapPref(THEME),
    keymap:     mapPref(KEYMAP),
    dev:        mapPref(DEV),
    dateFormat: mapPref(DATE_FORMAT),
    timeFormat: mapPref(TIME_FORMAT),
    perPage:    mapPref(ROWS_PER_PAGE),

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
    },

    dateOptions() {
      const now = day();

      return this.$store.getters['prefs/options'](DATE_FORMAT).map((value) => {
        return {
          label: now.format(value),
          value
        };
      });
    },

    timeOptions() {
      const now = day();

      return this.$store.getters['prefs/options'](TIME_FORMAT).map((value) => {
        return {
          label: now.format(value),
          value
        };
      });
    },

    perPageOptions() {
      return this.$store.getters['prefs/options'](ROWS_PER_PAGE);
    },
  },
};
</script>

<template>
  <div>
    <h1>Preferences</h1>

    <h4 class="mb-10">
      Theme
    </h4>
    <ButtonGroup v-model="theme" :options="themeOptions" />

    <h4 class="mb-10">
      Formatting
    </h4>
    <div class="row">
      <div class="col span-3">
        <LabeledSelect
          v-model="dateFormat"
          label="Date Format"
          :options="dateOptions"
          placeholder="Select a date format"
        />
      </div>
      <div class="col span-3">
        <LabeledSelect
          v-model="timeFormat"
          label="Time Format"
          :options="timeOptions"
          placeholder="Select a time format"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-3">
        <LabeledSelect
          v-model="perPage"
          label="Table Rows per Page"
          :options="perPageOptions"
          placeholder="Select a row count"
        />
      </div>
    </div>

    <h4 class="mb-10">
      YAML Editor Mode
    </h4>
    <ButtonGroup v-model="keymap" :options="keymapOptions" />

    <h4 class="mb-10">
      Advanced
    </h4>
    <label class="checkbox-container" mode="create" type="checkbox"><label class="checkbox-box"><input type="checkbox" tabindex="-1"> <span tabindex="0" aria-label="Interactive" role="checkbox" class="checkbox-custom"></span></label><span class="checkbox-label">Enable Developer Tools</span></label>
  </div>
</template>

<style lang="scss" scoped>
  h1 {
    margin: 0;
  }

  h4 {
    margin: 20px 0 0 0;

    &:first-of-type {
      margin-top: 0;
    }
  }
</style>
