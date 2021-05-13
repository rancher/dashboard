<script>
import day from 'dayjs';
import BackLink from '@/components/BackLink';
import BackRoute from '@/mixins/back-link';
import ButtonGroup from '@/components/ButtonGroup';
import Checkbox from '@/components/form/Checkbox';
import {
  mapPref, THEME, LANDING, KEYMAP, DEV, DATE_FORMAT, TIME_FORMAT, ROWS_PER_PAGE, HIDE_DESC, SHOW_PRE_RELEASE
} from '@/store/prefs';
import LabeledSelect from '@/components/form/LabeledSelect';
import { addObject } from '@/utils/array';

export default {
  layout:     'plain',
  components: {
    BackLink, ButtonGroup, LabeledSelect, Checkbox
  },
  mixins:     [BackRoute],
  computed:   {
    theme:          mapPref(THEME),
    keymap:         mapPref(KEYMAP),
    dev:            mapPref(DEV),
    landing:        mapPref(LANDING),
    dateFormat:     mapPref(DATE_FORMAT),
    timeFormat:     mapPref(TIME_FORMAT),
    perPage:        mapPref(ROWS_PER_PAGE),
    hideDesc:       mapPref(HIDE_DESC),
    showPreRelease:   mapPref(SHOW_PRE_RELEASE),

    themeOptions() {
      return this.$store.getters['prefs/options'](THEME).map((value) => {
        return {
          labelKey: `prefs.theme.${ value }`,
          value
        };
      });
    },

    landingOptions() {
      return this.$store.getters['prefs/options'](LANDING).map((value) => {
        return {
          labelKey: `prefs.landing.${ value }`,
          value
        };
      });
    },

    keymapOptions() {
      return this.$store.getters['prefs/options'](KEYMAP).map((value) => {
        return {
          labelKey: `prefs.keymap.${ value }`,
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

    helmOptions() {
      return this.$store.getters['prefs/options'](SHOW_PRE_RELEASE).map((value) => {
        return {
          labelKey: `prefs.helm.${ value }`,
          value
        };
      });
    },

    pm() {
      const now = day('1982-02-24 06:00:00 PM');

      return now.format(this.timeFormat.replace(/:ss/, ''));
    },

    am() {
      const now = day('1982-02-24 06:00:00 AM');

      return now.format(this.timeFormat.replace(/:ss/, ''));
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

      return this.$store.getters['prefs/options'](ROWS_PER_PAGE).map(count => ({
        label: t('prefs.perPage.value', { count }),
        value: count
      }));
    },

    hideDescriptions: {
      get() {
        return this.hideDesc.includes('ALL');
      },

      set(neu) {
        let val;

        if ( neu ) {
          val = this.hideDesc.slice();
          addObject(val, 'ALL');
        } else {
          // On unset, clear all remembered individual ones too
          val = [];
        }

        this.hideDesc = val;
      }
    },
  },
};
</script>

<template>
  <div>
    <BackLink :link="backLink" />
    <h1 v-t="'prefs.title'" />

    <h4 v-t="'prefs.theme.label'" />
    <div>
      <ButtonGroup v-model="theme" :options="themeOptions" />
    </div>
    <div class="mt-10">
      <t k="prefs.theme.autoDetail" :pm="pm" :am="am" />
    </div>
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
          option-key="value"
          option-label="label"
          placeholder="Select a row count"
        />
      </div>
    </div>
    <hr />
    <div class="row">
      <div class="col span-8">
        <h4 v-t="'prefs.keymap.label'" />
        <ButtonGroup v-model="keymap" :options="keymapOptions" />
      </div>
      <div class="col span-4">
        <h4 v-t="'prefs.advanced'" />
        <Checkbox v-model="dev" :label="t('prefs.dev.label', {}, true)" />
        <Checkbox v-model="hideDescriptions" :label="t('prefs.hideDesc.label')" />
      </div>
    </div>
    <hr />
    <div class="row">
      <div class="col">
        <h4 v-t="'prefs.helm.label'" />
        <ButtonGroup v-model="showPreRelease" :options="helmOptions" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  hr {
    margin: 20px 0;
  }
</style>
