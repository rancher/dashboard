<script>
import day from 'dayjs';
import ButtonGroup from '@/components/ButtonGroup';
import {
  mapPref, THEME, LANDING, KEYMAP, DEV, DATE_FORMAT, TIME_FORMAT, ROWS_PER_PAGE
} from '@/store/prefs';
import LabeledSelect from '@/components/form/LabeledSelect';

export default {
  components: { ButtonGroup, LabeledSelect },
  computed:   {
    theme:      mapPref(THEME),
    keymap:     mapPref(KEYMAP),
    dev:        mapPref(DEV),
    dateFormat: mapPref(DATE_FORMAT),
    timeFormat: mapPref(TIME_FORMAT),
    perPage:    mapPref(ROWS_PER_PAGE),
    landing:    mapPref(LANDING),

    themeOptions() {
      const t = this.$store.getters['i18n/t'];

      return this.$store.getters['prefs/options'](THEME).map((value) => {
        return {
          label: t(`prefs.theme.${ value }`),
          value
        };
      });
    },

    landingOptions() {
      const t = this.$store.getters['i18n/t'];

      return this.$store.getters['prefs/options'](LANDING).map((value) => {
        return {
          label: t(`prefs.landing.${ value }`),
          value
        };
      });
    },

    keymapOptions() {
      const t = this.$store.getters['i18n/t'];

      return this.$store.getters['prefs/options'](KEYMAP).map((value) => {
        return {
          label: t(`prefs.keymap.${ value }`),
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
      const t = this.$store.getters['i18n/t'];

      return this.$store.getters['prefs/options'](ROWS_PER_PAGE).map(count => t('prefs.perPage.value', { count }));
    },
  },
};
</script>

<template>
  <div>
    <h1 v-t="'prefs.title'" />

    <h4 v-t="'prefs.theme.label'" />
    <ButtonGroup v-model="theme" :options="themeOptions" />
    <hr />
    <h4 v-t="'prefs.landing.label'" />
    <ButtonGroup v-model="landing" :options="landingOptions" />
    <hr />
    <h4 v-t="'prefs.formatting'" />
    <div class="row">
      <div class="col span-4">
        <LabeledSelect
          v-model="dateFormat"
          :label="t('prefs.dateFormat.label')"
          :options="dateOptions"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          v-model="timeFormat"
          :label="t('prefs.timeFormat.label')"
          :options="timeOptions"
        />
      </div>

      <div class="col span-4">
        <LabeledSelect
          v-model.number="perPage"
          :label="t('prefs.perPage.label')"
          :options="perPageOptions"
          placeholder="Select a row count"
        />
      </div>
    </div>
    <hr />
    <div class="row">
      <div class="col span-4">
        <h4 v-t="'prefs.keymap.label'" />
        <ButtonGroup v-model="keymap" :options="keymapOptions" />
      </div>
      <div class="col span-4">
        <h4 v-t="'prefs.advanced'" />
        <label class="checkbox-container" mode="create" type="checkbox">
          <label class="checkbox-box">
            <input v-model="dev" type="checkbox" tabindex="-1"> <span tabindex="0" aria-label="Interactive" role="checkbox" class="checkbox-custom"></span>
          </label>
          <span v-t="'prefs.dev.label'" class="checkbox-label" />
        </label>
      </div>
    </div>
  </div>
  </div>
</template>

<style lang="scss" scoped>
  hr {
    margin: 20px 0;
  }
</style>
