<script>
import isEmpty from 'lodash/isEmpty';

import Checkbox from '@shell/components/form/Checkbox';
import Loading from '@shell/components/Loading';
import AsyncButton from '@shell/components/AsyncButton';
import Banner from '@shell/components/Banner';
import BannerSettings from '@shell/components/form/BannerSettings';
import { allHash } from '@shell/utils/promise';
import { MANAGEMENT } from '@shell/config/types';
import { getVendor } from '@shell/config/private-label';
import { SETTING } from '@shell/config/settings';
import { clone } from '@shell/utils/object';
import { _EDIT, _VIEW } from '@shell/config/query-params';

const DEFAULT_BANNER_SETTING = {
  bannerHeader: {
    background:      null,
    color:           null,
    textAlignment:   'center',
    fontWeight:      null,
    fontStyle:       null,
    fontSize:        '14px',
    textDecoration:  null,
    text:            null,
  },
  bannerFooter: {
    background:      null,
    color:           null,
    textAlignment:   'center',
    fontWeight:      null,
    fontStyle:       null,
    fontSize:        '14px',
    textDecoration:  null,
    text:            null
  },
  bannerConsent:  {
    background:      null,
    color:           null,
    textAlignment:   'center',
    fontWeight:      null,
    fontStyle:       null,
    fontSize:        '14px',
    textDecoration:  null,
    text:            null,
    button:          null,
  },
  showHeader:   'false',
  showFooter:   'false',
  showConsent:  'false'
};

export default {
  layout: 'authenticated',

  components: {
    Checkbox, Loading, AsyncButton, Banner, BannerSettings
  },

  async fetch() {
    const hash = await allHash({ uiBannerSetting: this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.BANNERS }) });

    Object.assign(this, hash);
  },

  data() {
    return {
      vendor: getVendor(),

      uiBannerSetting: null,
      bannerVal:       {},

      errors: [],

    };
  },

  computed: {
    mode() {
      const schema = this.$store.getters[`management/schemaFor`](MANAGEMENT.SETTING);

      return schema?.resourceMethods?.includes('PUT') ? _EDIT : _VIEW;
    },
    headerMode() {
      return this.bannerVal?.showHeader === 'true' ? _EDIT : _VIEW;
    },
    footerMode() {
      return this.bannerVal?.showFooter === 'true' ? _EDIT : _VIEW;
    },
    consentMode() {
      return this.bannerVal?.showConsent === 'true' ? _EDIT : _VIEW;
    }
  },

  watch: {
    uiBannerSetting(neu) {
      if (neu?.value && neu.value !== '') {
        try {
          const parsedBanner = JSON.parse(neu.value);

          this.bannerVal = this.checkOrUpdateLegacyUIBannerSetting(parsedBanner);
        } catch {}
      }
    }
  },

  methods: {
    checkOrUpdateLegacyUIBannerSetting(parsedBanner) {
      const {
        bannerHeader, bannerFooter, bannerConsent, banner
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

      <template>
        <!-- Header Settings -->
        <h2 class="mt-40 mb-40">
          {{ t('banner.headerBanner') }}
        </h2>
        <div class="row mb-20">
          <div class="col span-6">
            <Checkbox
              :value="bannerVal.showHeader === 'true'"
              :label="t('banner.showHeader')"
              :mode="mode"
              @input="e=>$set(bannerVal, 'showHeader', e.toString())"
            />
          </div>
        </div>
        <BannerSettings
          v-model="bannerVal"
          banner-type="bannerHeader"
          :mode="headerMode"
        />

        <!-- Footer settings -->
        <h2 class="mt-40 mb-40">
          {{ t('banner.footerBanner') }}
        </h2>
        <div class="row mt-40 mb-20">
          <div class="col span-6">
            <Checkbox
              :value="bannerVal.showFooter === 'true'"
              :label="t('banner.showFooter')"
              :mode="mode"
              @input="e=>$set(bannerVal, 'showFooter', e.toString())"
            />
          </div>
        </div>
        <BannerSettings
          v-model="bannerVal"
          banner-type="bannerFooter"
          :mode="footerMode"
        />
      </template>

      <!-- Consent settings -->
      <h2 class="mt-40 mb-40">
        {{ t('banner.loginScreenBanner') }}
      </h2>
      <template>
        <div class="row mt-40 mb-20">
          <div class="col span-6">
            <Checkbox
              :value="bannerVal.showConsent === 'true'"
              :label="t('banner.showConsent')"
              :mode="mode"
              @input="e => $set(bannerVal, 'showConsent', e.toString())"
            />
          </div>
        </div>
        <BannerSettings
          v-model="bannerVal"
          banner-type="bannerConsent"
          :mode="consentMode"
        />
      </template>
    </div>
    <template v-for="err in errors">
      <Banner :key="err" color="error" :label="err" />
    </template>
    <div>
      <AsyncButton class="pull-right mt-20" mode="apply" @click="save" />
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
</style>
