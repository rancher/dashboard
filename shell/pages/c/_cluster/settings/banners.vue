<script>
import isEmpty from 'lodash/isEmpty';

import { Checkbox } from '@components/Form/Checkbox';
import Loading from '@shell/components/Loading';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';
import BannerSettings from '@shell/components/form/BannerSettings';
import { allHash } from '@shell/utils/promise';
import { MANAGEMENT } from '@shell/config/types';
import { getVendor } from '@shell/config/private-label';
import { SETTING } from '@shell/config/settings';
import { clone } from '@shell/utils/object';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import NotificationSettings from '@shell/components/form/NotificationSettings.vue';
import { getIndividualBanners, overlayIndividualBanners } from '@shell/utils/banners';

const DEFAULT_BANNER_SETTING = {
  loginError:   { message: '', showMessage: 'false' },
  bannerHeader: {
    background:     null,
    color:          null,
    textAlignment:  'center',
    fontWeight:     null,
    fontStyle:      null,
    fontSize:       '14px',
    textDecoration: null,
    text:           null,
  },
  bannerFooter: {
    background:     null,
    color:          null,
    textAlignment:  'center',
    fontWeight:     null,
    fontStyle:      null,
    fontSize:       '14px',
    textDecoration: null,
    text:           null
  },
  bannerConsent: {
    background:     null,
    color:          null,
    textAlignment:  'center',
    fontWeight:     null,
    fontStyle:      null,
    fontSize:       '14px',
    textDecoration: null,
    text:           null,
    button:         null,
  },
  showHeader:  'false',
  showFooter:  'false',
  showConsent: 'false'
};

export default {
  components: {
    Checkbox,
    Loading,
    AsyncButton,
    Banner,
    BannerSettings,
    NotificationSettings
  },

  async fetch() {
    // We fetch all settings, so we can check for individual banner setting resources
    // We will have already fetched all settings, so there is no performance impact doing this versus fetching individual settings
    const hash = await allHash({ uiBannerSetting: this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.BANNERS }) });

    Object.assign(this, hash);

    this.uiBannerIndividual = getIndividualBanners(this.$store);
  },

  data() {
    return {
      vendor: getVendor(),

      uiBannerSetting:    null,
      uiBannerIndividual: {},
      bannerVal:          {},

      errors: [],
    };
  },

  computed: {
    mode() {
      const schema = this.$store.getters[`management/schemaFor`](MANAGEMENT.SETTING);

      return schema?.resourceMethods?.includes('PUT') ? _EDIT : _VIEW;
    },

    headerMode() {
      // If the individual setting is used, then always view mode
      if (this.uiBannerIndividual.bannerHeader) {
        return _VIEW;
      }

      return this.bannerVal?.showHeader === 'true' ? _EDIT : _VIEW;
    },
    footerMode() {
      // If the individual setting is used, then always view mode
      if (this.uiBannerIndividual.bannerFooter) {
        return _VIEW;
      }

      return this.bannerVal?.showFooter === 'true' ? _EDIT : _VIEW;
    },
    consentMode() {
      // If the individual setting is used, then always view mode
      if (this.uiBannerIndividual.bannerConsent) {
        return _VIEW;
      }

      return this.bannerVal?.showConsent === 'true' ? _EDIT : _VIEW;
    }
  },

  watch: {
    uiBannerSetting(neu) {
      if (neu?.value && neu.value !== '') {
        try {
          const parsedBanner = JSON.parse(neu.value);

          this.bannerVal = this.checkOrUpdateLegacyUIBannerSetting(parsedBanner);

          overlayIndividualBanners(this.bannerVal, this.uiBannerIndividual);
        } catch {}
      }
    }
  },

  methods: {
    checkOrUpdateLegacyUIBannerSetting(parsedBanner) {
      const {
        bannerHeader, bannerFooter, bannerConsent, banner, loginError
      } = parsedBanner;

      if (isEmpty(bannerHeader) && isEmpty(bannerFooter) && isEmpty(bannerConsent)) {
        let neu = DEFAULT_BANNER_SETTING;

        if (!isEmpty(banner)) {
          const cloned = clone(( banner ?? {} ));

          if (cloned?.textColor) {
            cloned['color'] = cloned.textColor;
            delete cloned.textColor;
          }

          neu = {
            bannerHeader:  { ...cloned },
            bannerFooter:  { ...cloned },
            loginError:    { ...DEFAULT_BANNER_SETTING.loginError, loginError: loginError?.showMessage === 'false' ? 'false' : 'true' },
            bannerConsent: { ...DEFAULT_BANNER_SETTING.bannerConsent },
            showHeader:    parsedBanner?.showHeader === 'true' ? 'true' : 'false',
            showFooter:    parsedBanner?.showFooter === 'true' ? 'true' : 'false',
            showConsent:   parsedBanner?.showConsent === 'true' ? 'true' : 'false'
          };
        }

        return neu;
      }

      // If user has existing banners, they may not have consent banner - use default value
      if (isEmpty(bannerConsent)) {
        parsedBanner.bannerConsent = { ...DEFAULT_BANNER_SETTING.bannerConsent };
      }

      if (isEmpty(loginError)) {
        parsedBanner.loginError = { ...DEFAULT_BANNER_SETTING.loginError };
      }

      return parsedBanner;
    },

    async save(btnCB) {
      this.uiBannerSetting.value = JSON.stringify(this.bannerVal);

      this.errors = [];

      try {
        await Promise.all([
          this.uiBannerSetting.save()
        ]);
        btnCB(true);
      } catch (err) {
        this.errors.push(err);
        btnCB(false);
      }
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h1 class="mb-20">
      {{ t('banner.label') }}
    </h1>
    <div>
      <label class="text-label">
        {{ t(`advancedSettings.descriptions.${ 'ui-banners' }`, {}, true) }}
      </label>

      <!-- Header Settings -->
      <h2 class="mt-40 mb-10 setting-title">
        {{ t('banner.headerBanner') }}
        <i
          v-if="!!uiBannerIndividual.bannerHeader"
          class="icon icon-lock"
        />
      </h2>
      <div
        v-if="!!uiBannerIndividual.bannerHeader"
        class="row mb-10"
      >
        <Banner
          color="warning"
          class="mt-0"
          :label="t('banner.individualSetting', {name: 'ui-banner-header'}, true)"
        />
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <Checkbox
            :disabled="!!uiBannerIndividual.bannerHeader"
            :value="bannerVal.showHeader === 'true'"
            :label="t('banner.showHeader')"
            :mode="mode"
            @update:value="e=> bannerVal.showHeader=e.toString()"
          />
        </div>
      </div>
      <BannerSettings
        v-model:value="bannerVal"
        banner-type="bannerHeader"
        :mode="headerMode"
      />

      <!-- Footer settings -->
      <h2 class="mt-40 mb-10 setting-title">
        {{ t('banner.footerBanner') }}
        <i
          v-if="!!uiBannerIndividual.bannerFooter"
          class="icon icon-lock"
        />
      </h2>
      <div
        v-if="!!uiBannerIndividual.bannerFooter"
        class="row mb-10"
      >
        <Banner
          color="warning"
          class="mt-0"
          :label="t('banner.individualSetting', {name: 'ui-banner-footer'}, true)"
        />
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <Checkbox
            :disabled="!!uiBannerIndividual.bannerFooter"
            :value="bannerVal.showFooter === 'true'"
            :label="t('banner.showFooter')"
            :mode="mode"
            @update:value="e=>bannerVal.showFooter = e.toString()"
          />
        </div>
      </div>
      <BannerSettings
        v-model:value="bannerVal"
        banner-type="bannerFooter"
        :mode="footerMode"
      />

      <!-- Consent settings -->
      <h2 class="mt-40 mb-10 setting-title">
        {{ t('banner.loginScreenBanner') }}
        <i
          v-if="!!uiBannerIndividual.bannerConsent"
          class="icon icon-lock"
        />
      </h2>
      <div
        v-if="!!uiBannerIndividual.bannerConsent"
        class="row mb-10"
      >
        <Banner
          color="warning"
          class="mt-0"
          :label="t('banner.individualSetting', {name: 'ui-banner-login-consent'}, true)"
        />
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <Checkbox
            :disabled="!!uiBannerIndividual.bannerConsent"
            :value="bannerVal.showConsent === 'true'"
            :label="t('banner.showConsent')"
            :mode="mode"
            @update:value="e => bannerVal.showConsent = e.toString()"
          />
        </div>
      </div>
      <BannerSettings
        v-model:value="bannerVal"
        banner-type="bannerConsent"
        :mode="consentMode"
      />
      <h2 class="mt-40 mb-40">
        {{ t('notifications.loginError.header') }}
      </h2>
      <NotificationSettings
        v-model:value="bannerVal.loginError"
        :mode="mode"
        :label="t('notifications.loginError.messageLabel')"
      />
    </div>
    <template
      v-for="(err, i) in errors"
      :key="i"
    >
      <Banner
        color="error"
        :label="err"
      />
    </template>
    <div v-if="mode === 'edit'">
      <AsyncButton
        class="pull-right mt-20"
        mode="apply"
        @click="save"
      />
    </div>
  </div>
</template>

<style scoped lang='scss'>
.overlay {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--overlay-bg);
  z-index: 1;
}

// Ensure setting titles have the icon vertically aligned when present, with spacing between
// the icon and the text
h2.setting-title {
  align-items: center;
  display: flex;

  > i {
    padding-left: 5px;
  }
}
</style>
