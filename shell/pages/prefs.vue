<script>
import day from 'dayjs';
import { mapGetters } from 'vuex';
import { isAdminUser } from '@shell/store/type-map';
import BackLink from '@shell/components/BackLink';
import BackRoute from '@shell/mixins/back-link';
import ButtonGroup from '@shell/components/ButtonGroup';
import { Checkbox } from '@components/Form/Checkbox';
import LandingPagePreference from '@shell/components/LandingPagePreference';
import {
  mapPref, THEME, KEYMAP, DATE_FORMAT, TIME_FORMAT, ROWS_PER_PAGE, HIDE_DESC, SHOW_PRE_RELEASE,
  VIEW_IN_API, ALL_NAMESPACES, THEME_SHORTCUT, PLUGIN_DEVELOPER, SCALE_POOL_PROMPT
  , MENU_MAX_CLUSTERS
} from '@shell/store/prefs';

import LabeledSelect from '@shell/components/form/LabeledSelect';
import { addObject } from '@shell/utils/array';
import LocaleSelector from '@shell/components/LocaleSelector';
import TabTitle from '@shell/components/TabTitle';

export default {
  components: {
    BackLink, ButtonGroup, LabeledSelect, Checkbox, LandingPagePreference, LocaleSelector, TabTitle
  },
  mixins: [BackRoute],
  data() {
    return { admin: isAdminUser(this.$store.getters) };
  },
  computed: {
    keymap:            mapPref(KEYMAP),
    viewInApi:         mapPref(VIEW_IN_API),
    allNamespaces:     mapPref(ALL_NAMESPACES),
    themeShortcut:     mapPref(THEME_SHORTCUT),
    dateFormat:        mapPref(DATE_FORMAT),
    timeFormat:        mapPref(TIME_FORMAT),
    perPage:           mapPref(ROWS_PER_PAGE),
    hideDesc:          mapPref(HIDE_DESC),
    showPreRelease:    mapPref(SHOW_PRE_RELEASE),
    pluginDeveloper:   mapPref(PLUGIN_DEVELOPER),
    scalingDownPrompt: mapPref(SCALE_POOL_PROMPT),

    ...mapGetters(['isSingleProduct']),
    ...mapGetters({ hasMultipleLocales: 'i18n/hasMultipleLocales' }),

    isHarvester() {
      return this.isSingleProduct?.productName === 'harvester';
    },

    theme: {
      get() {
        return this.$store.getters['prefs/get'](THEME);
      },
      set(neu) {
        this.$store.dispatch('prefs/setTheme', neu);
      }
    },

    themeOptions() {
      return this.$store.getters['prefs/options'](THEME).map((value) => {
        return {
          labelKey: `prefs.theme.${ value }`,
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

      const currentDate = this.$store.getters['prefs/options'](DATE_FORMAT).map((value) => {
        return now.format(value);
      });

      // Check for duplication of date (date with same digit in month and day) in options list eg. (3/3/2023)
      const isDuplicate = currentDate.some((item, idx) => {
        return currentDate.indexOf(item) !== idx;
      });

      return this.$store.getters['prefs/options'](DATE_FORMAT).map((value, index) => {
        const updateValue = `${ now.format(value) } (${ value })`;

        if (index > 1 && isDuplicate) {
          return {
            label: updateValue,
            value
          };
        }

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
      const time = day().hour(18).minute(0).second(0);

      return time.format(this.timeFormat.replace(/:ss/, ''));
    },

    am() {
      const time = day().hour(6).minute(0).second(0);

      return time.format(this.timeFormat.replace(/:ss/, ''));
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

      return this.$store.getters['prefs/options'](ROWS_PER_PAGE).map((count) => ({
        label: t('prefs.perPage.value', { count }),
        value: count
      }));
    },

    menuClusterOptions() {
      const t = this.$store.getters['i18n/t'];

      return this.$store.getters['prefs/options'](MENU_MAX_CLUSTERS).map((count) => ({
        label: t('prefs.clusterToShow.value', { count }),
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
  }
};
</script>

<template>
  <div>
    <BackLink :link="backLink" />
    <h1
      class="mb-20"
    >
      <TabTitle breadcrumb="vendor-only">
        {{ t('prefs.title') }}
      </TabTitle>
    </h1>

    <!-- Language -->
    <div
      v-if="hasMultipleLocales && !isHarvester"
      class="mt-10 mb-10"
    >
      <h4
        id="prefs-language"
        v-t="'prefs.language'"
      />
      <div class="row">
        <div class="col span-4">
          <LocaleSelector
            data-testid="prefs__languageSelector"
            aria-labelledby="prefs-language"
          />
        </div>
      </div>
    </div>
    <!-- Theme -->
    <div class="mt-10 mb-10">
      <h4 v-t="'prefs.theme.label'" />
      <ButtonGroup
        v-model:value="theme"
        data-testid="prefs__themeOptions"
        :options="themeOptions"
      />
      <div class="mt-10">
        <t
          k="prefs.theme.autoDetail"
          :pm="pm"
          :am="am"
        />
      </div>
    </div>
    <!-- Login landing page -->
    <div
      v-if="!isSingleProduct"
      class="mt-10 mb-10"
    >
      <hr>
      <h4 v-t="'prefs.landing.label'" />
      <LandingPagePreference
        data-testid="prefs__landingPagePreference"
      />
    </div>
    <!-- Display Settings -->
    <div class="mt-10 mb-10">
      <hr>
      <h4 v-t="'prefs.displaySettings.title'" />
      <p class="set-landing-leadin">
        {{ t('prefs.displaySettings.detail', {}, raw=true) }}
      </p>
      <div class="row mt-20">
        <div class="col span-4">
          <LabeledSelect
            v-model:value="dateFormat"
            data-testid="prefs__displaySetting__dateFormat"
            :label="t('prefs.dateFormat.label')"
            option-key="value"
            :options="dateOptions"
          />
        </div>
        <div class="col span-4">
          <LabeledSelect
            v-model:value="timeFormat"
            data-testid="prefs__displaySetting__timeFormat"
            :label="t('prefs.timeFormat.label')"
            :options="timeOptions"
          />
        </div>
      </div>

      <div class="row mt-20">
        <div class="col span-4">
          <LabeledSelect
            v-model:value="perPage"
            data-testid="prefs__displaySetting__perPage"
            :label="t('prefs.perPage.label')"
            :options="perPageOptions"
            option-key="value"
            option-label="label"
            placeholder="Select a row count"
          />
        </div>
      </div>
    </div>
    <!-- Confirmation setting -->
    <div
      v-if="!isSingleProduct"
      class="col adv-features mt-10 mb-10"
    >
      <hr>
      <h4 v-t="'prefs.confirmationSetting.title'" />
      <Checkbox
        v-model:value="scalingDownPrompt"
        data-testid="prefs__scalingDownPrompt"
        :label="t('prefs.confirmationSetting.scalingDownPrompt')"
        class="mt-10"
      />
    </div>
    <!-- Advanced Features -->
    <div class="col adv-features mt-10 mb-10">
      <hr>
      <h4 v-t="'prefs.advFeatures.title'" />
      <Checkbox
        v-model:value="viewInApi"
        data-testid="prefs__viewInApi"
        :label="t('prefs.advFeatures.viewInApi', {}, true)"
        class="mt-10"
      />
      <template v-if="!isHarvester">
        <br>
        <Checkbox
          v-model:value="allNamespaces"
          data-testid="prefs__allNamespaces"
          :label="t('prefs.advFeatures.allNamespaces', {}, true)"
          class="mt-20"
        />
      </template>
      <br>
      <Checkbox
        v-model:value="themeShortcut"
        data-testid="prefs__themeShortcut"
        :label="t('prefs.advFeatures.themeShortcut', {}, true)"
        class="mt-20"
      />
      <br>
      <Checkbox
        v-if="!isSingleProduct"
        v-model:value="hideDescriptions"
        data-testid="prefs__hideDescriptions"
        :label="t('prefs.hideDesc.label')"
        class="mt-20"
      />
      <template v-if="admin">
        <br>
        <Checkbox
          v-model:value="pluginDeveloper"
          :label="t('prefs.advFeatures.pluginDeveloper', {}, true)"
          class="mt-20"
        />
      </template>
    </div>
    <!-- YAML editor key mapping -->
    <div class="col mt-10 mb-10">
      <hr>
      <h4 v-t="'prefs.keymap.label'" />
      <ButtonGroup
        v-model:value="keymap"
        data-testid="prefs__keymapOptions"
        :options="keymapOptions"
      />
    </div>
    <!-- Helm Charts -->
    <div
      v-if="!isSingleProduct"
      class="col mt-10 mb-40"
    >
      <hr>
      <h4 v-t="'prefs.helm.label'" />
      <ButtonGroup
        v-model:value="showPreRelease"
        data-testid="prefs__helmOptions"
        :options="helmOptions"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  hr {
    margin: 20px 0;
  }
  .wrap-text {
    overflow-wrap: break-word;
    max-width: 80vw;
    color: var(--input-label);
  }
</style>
