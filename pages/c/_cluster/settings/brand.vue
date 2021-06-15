<script>
import LabeledInput from '@/components/form/LabeledInput';
import ColorInput from '@/components/form/ColorInput';

import Checkbox from '@/components/form/Checkbox';
import FileSelector from '@/components/form/FileSelector';
import SimpleBox from '@/components/SimpleBox';
import Loading from '@/components/Loading';
import AsyncButton from '@/components/AsyncButton';
import Banner from '@/components/Banner';
import { allHash } from '@/utils/promise';
import { MANAGEMENT } from '@/config/types';
import { getVendor, setVendor } from '@/config/private-label';
import { SETTING, fetchOrCreateSetting } from '@/config/settings';
const Color = require('color');
const parse = require('url-parse');

export default {
  layout: 'authenticated',

  components: {
    LabeledInput, Checkbox, FileSelector, Loading, SimpleBox, AsyncButton, Banner, ColorInput
  },

  async fetch() {
    const hash = await allHash({
      uiPLSetting:            this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.PL }),
      uiIssuesSetting:        this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.ISSUES }),
      uiBannerSetting:        this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.BANNERS }),
      uiLogoDarkSetting:      fetchOrCreateSetting(this.$store, SETTING.LOGO_DARK, ''),
      uiLogoLightSetting:     fetchOrCreateSetting(this.$store, SETTING.LOGO_LIGHT, ''),
      uiColorSetting:         fetchOrCreateSetting(this.$store, SETTING.PRIMARY_COLOR, ''),
      uiCommunitySetting:     fetchOrCreateSetting(this.$store, SETTING.COMMUNITY_LINKS, 'true'),
    });

    Object.assign(this, hash);

    try {
      this.bannerVal = JSON.parse(hash.uiBannerSetting.value);
    } catch {
      this.bannerVal = {};
    }
    if (!this.bannerVal.banner) {
      this.$set(this.bannerVal, 'banner', {});
    }
    if (hash.uiLogoDarkSetting.value) {
      try {
        this.uiLogoDark = hash.uiLogoDarkSetting.value;
        this.customizeLogo = true;
      } catch {}
    }
    if (hash.uiLogoLightSetting.value) {
      try {
        this.uiLogoLight = hash.uiLogoLightSetting.value;

        this.customizeLogo = true;
      } catch {}
    }
    if (hash.uiColorSetting.value) {
      this.uiColor = Color(hash.uiColorSetting.value).hex();
      this.customizeColor = true;
    }
  },

  data() {
    let uiColor = getComputedStyle(document.body).getPropertyValue('--primary');
    const suse = document.querySelector('.suse');

    if (suse) {
      uiColor = getComputedStyle(suse).getPropertyValue('--primary');
    }

    return {
      vendor:      getVendor(),
      uiPLSetting: {},

      uiIssuesSetting: {},

      uiBannerSetting: null,
      bannerVal:       {},

      uiLogoDarkSetting:  {},
      uiLogoDark:         '',
      uiLogoLightSetting: {},
      uiLogoLight:        '',
      customizeLogo:      false,

      uiColorSetting: {},
      uiColor,
      customizeColor: false,

      uiCommunitySetting: {},

      errors: []
    };
  },

  watch: {},

  methods: {
    updateLogo(img, key) {
      this[key] = img;
    },

    setError(e) {
      this.errors = [];
      this.errors.push(e);
    },

    validateUrl(url) {
      const parsed = parse(url, {});

      if (!parsed.protocol) {
        this.errors.push(this.t('branding.uiIssues.invalidUrl'));

        return false;
      }

      return true;
    },

    async save(btnCB) {
      if (this.uiIssuesSetting.value && !this.validateUrl(this.uiIssuesSetting.value)) {
        return btnCB(false);
      }
      this.uiBannerSetting.value = JSON.stringify(this.bannerVal);
      if (this.customizeLogo) {
        this.uiLogoLightSetting.value = this.uiLogoLight;
        this.uiLogoDarkSetting.value = this.uiLogoDark;
      } else {
        this.uiLogoLightSetting.value = '';
        this.uiLogoDarkSetting.value = '';
      }

      if (this.customizeColor) {
        this.uiColorSetting.value = Color(this.uiColor).rgb().string();
      } else {
        this.uiColorSetting.value = null;
      }

      this.errors = [];

      try {
        await Promise.all([
          this.uiPLSetting.save(),
          this.uiIssuesSetting.save(),
          this.uiBannerSetting.save(),
          this.uiLogoDarkSetting.save(),
          this.uiLogoLightSetting.save(),
          this.uiColorSetting.save(),
          this.deCommunitySetting.save()
        ]);
        if (this.uiPLSetting.value !== this.vendor) {
          setVendor(this.uiPLSetting.value);
        }
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
      {{ t('branding.label') }}
    </h1>
    <div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput v-model="uiPLSetting.value" :label="t('branding.uiPL.label')" />
        </div>
      </div>

      <h3 class="mt-40 mb-5 pb-5">
        {{ t('branding.uiIssues.label') }}
      </h3>
      <label class="text-label">
        {{ t(`advancedSettings.descriptions.${ 'ui-issues' }`, {}, true) }}
      </label>
      <div :style="{'align-items':'center'}" class="row mt-10">
        <div class="col span-6 pb-5">
          <LabeledInput v-model="uiIssuesSetting.value" :label="t('branding.uiIssues.issuesUrl')" />
        </div>
        <div class="col span-6">
          <Checkbox v-model="uiCommunitySetting.value" :label="t('branding.uiIssues.communityLinks')" />
        </div>
      </div>

      <h3 class="mt-40 mb-5 pb-5">
        {{ t('branding.logos.label') }}
      </h3>
      <label class="text-label">
        {{ t('branding.logos.tip', {}, true) }}
      </label>

      <div class="row mt-10 mb-20">
        <Checkbox v-model="customizeLogo" :label="t('branding.logos.useCustom')" />
      </div>

      <div v-if="customizeLogo" class="row mb-20">
        <div class="col logo-container span-6">
          <div class="mb-10">
            <FileSelector
              :byte-limit="20000"
              :read-as-data-url="true"
              class="role-secondary"
              :label="t('branding.logos.uploadLight')"
              @error="setError"
              @selected="updateLogo($event, 'uiLogoLight')"
            />
          </div>
          <SimpleBox v-if="uiLogoLight || uiLogoDark" class="theme-light  mb-10">
            <label class="text-muted">{{ t('branding.logos.lightPreview') }}</label>
            <img class="logo-preview" :src="uiLogoLight ? uiLogoLight : uiLogoDark" />
          </SimpleBox>
        </div>
        <div class="col logo-container span-6">
          <div class="mb-10">
            <FileSelector
              :byte-limit="20000"
              :read-as-data-url="true"
              class="role-secondary"
              :label="t('branding.logos.uploadDark')"
              @error="setError"
              @selected="updateLogo($event, 'uiLogoDark')"
            />
          </div>
          <SimpleBox v-if="uiLogoDark || uiLogoLight" class="theme-dark  mb-10">
            <label class="text-muted">{{ t('branding.logos.darkPreview') }}</label>
            <img class="logo-preview" :src="uiLogoDark ? uiLogoDark : uiLogoLight" />
          </SimpleBox>
        </div>
      </div>

      <h3 class="mt-40 mb-5 pb-0">
        {{ t('branding.color.label') }}
      </h3>
      <label class="text-label">
        {{ t('branding.color.tip', {}, true) }}
      </label>
      <div class="row mt-20">
        <Checkbox v-model="customizeColor" :label="t('branding.color.useCustom')" />
      </div>
      <div v-if="customizeColor" class="row mt-20 mb-20">
        <ColorInput v-model="uiColor" />
      </div>

      <h3 class="mb-5 pb-5 mt-40">
        {{ t('branding.uiBanner.label') }}
      </h3>
      <label class="text-label">
        {{ t(`advancedSettings.descriptions.${ 'ui-banners' }`, {}, true) }}
      </label>

      <div class="row mt-20 mb-20">
        <Checkbox :value="bannerVal.showHeader==='true'" :label="t('branding.uiBanner.showHeader')" @input="e=>$set(bannerVal, 'showHeader', e.toString())" />
        <Checkbox :value="bannerVal.showFooter==='true'" :label="t('branding.uiBanner.showFooter')" @input="e=>$set(bannerVal, 'showFooter', e.toString())" />
      </div>
      <template v-if="bannerVal.showHeader==='true' || bannerVal.showFooter==='true'">
        <div class="row">
          <div class="col span-12">
            <LabeledInput v-model="bannerVal.banner.text" :label="t('branding.uiBanner.text')" />
          </div>
        </div>
        <div class="row mt-10">
          <div class="col span-3">
            <ColorInput v-model="bannerVal.banner.color" :label="t('branding.uiBanner.textColor')" />
          </div>
          <div class="col span-3">
            <ColorInput v-model="bannerVal.banner.background" :label="t('branding.uiBanner.background')" />
          </div>
        </div>
      </template>
    </div>
    <template v-for="err in errors">
      <Banner :key="err" color="error" :label="err" />
    </template>
    <div>
      <AsyncButton class="pull-right" mode="apply" @click="save" />
    </div>
  </div>
</template>

<style scoped lang='scss'>
.logo-container {
    display: flex;
    flex-direction: column;

    ::v-deep.simple-box {
        position: relative;
        flex: 1;
        max-height: 120px;

        .content {
          height: 100%;
          display: flex;
        }

        .logo-preview {
          max-width: 100%;
        }
    }

    & LABEL {
      position: absolute;
      top: 10px;
      left: 10px;
    }
}

</style>
