<script>
import LabeledInput from '@/components/form/LabeledInput';
import ColorInput from '@/components/form/ColorInput';

import Checkbox from '@/components/form/Checkbox';
import RadioGroup from '@/components/form/RadioGroup';
import FileSelector from '@/components/form/FileSelector';
import SimpleBox from '@/components/SimpleBox';
import Loading from '@/components/Loading';
import AsyncButton from '@/components/AsyncButton';
import Banner from '@/components/Banner';
import { allHash } from '@/utils/promise';
import { MANAGEMENT } from '@/config/types';
import { getVendor, setVendor } from '@/config/private-label';
import { SETTING, fetchOrCreateSetting } from '@/config/settings';
import isEmpty from 'lodash/isEmpty';
import { clone } from '@/utils/object';
import { _EDIT, _VIEW } from '@/config/query-params';

const Color = require('color');
const parse = require('url-parse');

const DEFAULT_BANNER_SETTING = {
  bannerHeader: {
    background:      null,
    color:           null,
    textAlignment:   'center',
    fontWeight:      null,
    fontStyle:       null,
    textDecoration:  null,
    text:            null
  },
  bannerFooter: {
    background:      null,
    color:           null,
    textAlignment:   'center',
    fontWeight:      null,
    fontStyle:       null,
    textDecoration:  null,
    text:            null
  },
  showHeader:   'false',
  showFooter:   'false',
};

export default {
  layout: 'authenticated',

  components: {
    LabeledInput, Checkbox, RadioGroup, FileSelector, Loading, SimpleBox, AsyncButton, Banner, ColorInput
  },

  async fetch() {
    const hash = await allHash({
      uiPLSetting:            this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.PL }),
      uiIssuesSetting:        this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.ISSUES }),
      uiBannerSetting:        this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.BANNERS }),
      uiLogoDarkSetting:      fetchOrCreateSetting(this.$store, SETTING.LOGO_DARK, ''),
      uiLogoLightSetting:     fetchOrCreateSetting(this.$store, SETTING.LOGO_LIGHT, ''),
      uiColorSetting:         fetchOrCreateSetting(this.$store, SETTING.PRIMARY_COLOR, ''),
      uiLinkColorSetting:     fetchOrCreateSetting(this.$store, SETTING.LINK_COLOR, ''),
      uiCommunitySetting:     fetchOrCreateSetting(this.$store, SETTING.COMMUNITY_LINKS, 'true'),
    });

    Object.assign(this, hash);

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
    if (hash.uiLinkColorSetting.value) {
      this.uiLinkColor = Color(hash.uiLinkColorSetting.value).hex();
      this.customizeLinkColor = true;
    }
  },

  data() {
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

      uiColorSetting:     {},
      uiColor:            null,
      customizeColor:     false,
      uiLinkColorSetting: {},
      uiLinkColor:        null,
      customizeLinkColor: false,

      uiCommunitySetting: {},

      errors: []
    };
  },

  computed: {
    mode() {
      const schema = this.$store.getters[`management/schemaFor`](MANAGEMENT.SETTING);

      return schema?.resourceMethods?.includes('PUT') ? _EDIT : _VIEW;
    },

    radioOptions() {
      const options = ['left', 'center', 'right'];
      const labels = [
        this.t('branding.uiBanner.bannerAlignment.leftOption'),
        this.t('branding.uiBanner.bannerAlignment.centerOption'),
        this.t('branding.uiBanner.bannerAlignment.rightOption'),
      ];

      return { options, labels };
    },

    textDecorationOptions() {
      const options = [
        {
          style:  'fontWeight',
          label:  this.t('branding.uiBanner.bannerDecoration.bannerBold')
        },
        {
          style:  'fontStyle',
          label:  this.t('branding.uiBanner.bannerDecoration.bannerItalic')
        },
        {
          style:  'textDecoration',
          label:  this.t('branding.uiBanner.bannerDecoration.bannerUnderline')
        }
      ];

      return options;
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

  mounted() {
    let uiColor = getComputedStyle(document.body).getPropertyValue('--primary');
    let uiLinkColor = getComputedStyle(document.body).getPropertyValue('--link');
    const suse = document.querySelector('.suse');

    if (suse) {
      uiColor = getComputedStyle(suse).getPropertyValue('--primary');
      uiLinkColor = getComputedStyle(suse).getPropertyValue('--link');
    }

    // Only set the color to the default if not already set from the custom color
    this.uiColor = this.uiColor || uiColor.trim();
    this.uiLinkColor = this.uiLinkColor || uiLinkColor.trim();
  },

  methods: {
    checkOrUpdateLegacyUIBannerSetting(parsedBanner) {
      const { bannerHeader, bannerFooter, banner } = parsedBanner;

      if (isEmpty(bannerHeader) && isEmpty(bannerFooter)) {
        let neu = DEFAULT_BANNER_SETTING;

        if (!isEmpty(banner)) {
          const cloned = clone(( banner ?? {} ));

          if (cloned?.textColor) {
            cloned['color'] = cloned.textColor;
            delete cloned.textColor;
          }

          neu = {
            bannerHeader: { ...cloned },
            bannerFooter: { ...cloned },
            showHeader:   parsedBanner?.showHeader === 'true' ? 'true' : 'false',
            showFooter:   parsedBanner?.showFooter === 'true' ? 'true' : 'false',
          };
        }

        return neu;
      }

      return parsedBanner;
    },
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

      if (this.customizeLinkColor) {
        this.uiLinkColorSetting.value = Color(this.uiLinkColor).rgb().string();
      } else {
        this.uiLinkColorSetting.value = null;
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
          this.uiLinkColorSetting.save(),
          this.uiCommunitySetting.save()
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
          <LabeledInput v-model="uiPLSetting.value" :label="t('branding.uiPL.label')" :mode="mode" />
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
          <LabeledInput v-model="uiIssuesSetting.value" :label="t('branding.uiIssues.issuesUrl')" :mode="mode" />
        </div>
        <div class="col span-6">
          <Checkbox :value="uiCommunitySetting.value === 'true'" :label="t('branding.uiIssues.communityLinks')" :mode="mode" @input="e=>$set(uiCommunitySetting, 'value', e.toString())" />
        </div>
      </div>

      <h3 class="mt-40 mb-5 pb-5">
        {{ t('branding.logos.label') }}
      </h3>
      <label class="text-label">
        {{ t('branding.logos.tip', {}, true) }}
      </label>

      <div class="row mt-10 mb-20">
        <Checkbox v-model="customizeLogo" :label="t('branding.logos.useCustom')" :mode="mode" />
      </div>

      <div v-if="customizeLogo" class="row mb-20">
        <div class="col logo-container span-6">
          <div class="mb-10">
            <FileSelector
              :byte-limit="20000"
              :read-as-data-url="true"
              class="role-secondary"
              :label="t('branding.logos.uploadLight')"
              :mode="mode"
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
              :mode="mode"
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
        <Checkbox v-model="customizeColor" :label="t('branding.color.useCustom')" :mode="mode" />
      </div>
      <div v-if="customizeColor" class="row mt-20 mb-20">
        <ColorInput v-model="uiColor" />
      </div>

      <h3 class="mt-40 mb-5 pb-0">
        {{ t('branding.linkColor.label') }}
      </h3>
      <label class="text-label">
        {{ t('branding.linkColor.tip', {}, true) }}
      </label>
      <div class="row mt-20">
        <Checkbox
          v-model="customizeLinkColor"
          :label="t('branding.linkColor.useCustom')"
          :mode="mode"
        />
      </div>
      <div v-if="customizeLinkColor" class="row mt-20 mb-20">
        <ColorInput
          v-model="uiLinkColor"
          class="col"
        />
        <span class="col link-example">
          <a>
            Link Example
          </a>
        </span>
      </div>

      <h3 class="mb-5 pb-5 mt-40">
        {{ t('branding.uiBanner.label') }}
      </h3>
      <label class="text-label">
        {{ t(`advancedSettings.descriptions.${ 'ui-banners' }`, {}, true) }}
      </label>

      <template>
        <div class="row mt-20 mb-20">
          <div class="col span-6">
            <Checkbox :value="bannerVal.showHeader==='true'" :label="t('branding.uiBanner.showHeader')" :mode="mode" @input="e=>$set(bannerVal, 'showHeader', e.toString())" />
          </div>
        </div>
        <div v-if="bannerVal.showHeader==='true'" class="row mb-20">
          <div class="col span-12">
            <div class="row">
              <div class="col span-6">
                <LabeledInput v-model="bannerVal.bannerHeader.text" :label="t('branding.uiBanner.text')" />
              </div>
              <div class="col span-3">
                <RadioGroup
                  v-model="bannerVal.bannerHeader.textAlignment"
                  name="headerAlignment"
                  :label="t('branding.uiBanner.bannerAlignment.label')"
                  :options="radioOptions.options"
                  :labels="radioOptions.labels"
                  :mode="mode"
                />
              </div>
              <div class="col span-3">
                <h3>
                  {{ t('branding.uiBanner.bannerDecoration.label') }}
                </h3>
                <div v-for="o in textDecorationOptions" :key="o.style">
                  <Checkbox
                    v-model="bannerVal.bannerHeader[o.style]"
                    name="headerDecoration"
                    class="header-decoration-checkbox"
                    :mode="mode"
                    :label="o.label"
                    @input="e=>$set(bannerVal, o.style, e.toString())"
                  />
                </div>
              </div>
            </div>
            <div class="row mt-10">
              <div class="col span-6">
                <ColorInput v-model="bannerVal.bannerHeader.color" :label="t('branding.uiBanner.textColor')" />
              </div>
              <div class="col span-6">
                <ColorInput v-model="bannerVal.bannerHeader.background" :label="t('branding.uiBanner.background')" />
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col span-6">
            <Checkbox :value="bannerVal.showFooter==='true'" :label="t('branding.uiBanner.showFooter')" :mode="mode" @input="e=>$set(bannerVal, 'showFooter', e.toString())" />
          </div>
        </div>
        <div v-if="bannerVal.showFooter==='true'" class="row">
          <div class="col span-12 mt-20">
            <div class="row">
              <div class="col span-6">
                <LabeledInput v-model="bannerVal.bannerFooter.text" :label="t('branding.uiBanner.text')" />
              </div>
              <div class="col span-3">
                <RadioGroup
                  v-model="bannerVal.bannerFooter.textAlignment"
                  name="footerAlignment"
                  :label="t('branding.uiBanner.bannerAlignment.label')"
                  :options="radioOptions.options"
                  :labels="radioOptions.labels"
                  :mode="mode"
                />
              </div>
              <div class="col span-3">
                <h3>
                  {{ t('branding.uiBanner.bannerDecoration.label') }}
                </h3>
                <div v-for="o in textDecorationOptions" :key="o.style">
                  <Checkbox
                    v-model="bannerVal.bannerFooter[o.style]"
                    name="footerAlignment"
                    class="banner-decoration-checkbox"
                    :mode="mode"
                    :label="o.label"
                    @input="e=>$set(bannerVal, o.style, e.toString())"
                  />
                </div>
              </div>
            </div>
            <div class="row mt-10">
              <div class="col span-6">
                <ColorInput v-model="bannerVal.bannerFooter.color" :label="t('branding.uiBanner.textColor')" />
              </div>
              <div class="col span-6">
                <ColorInput v-model="bannerVal.bannerFooter.background" :label="t('branding.uiBanner.background')" />
              </div>
            </div>
          </div>
        </div>
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
.link-example {
  display: flex;
  align-content: center;

  a {
    margin: auto;
  }
}

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

.banner-decoration-checkbox {
  position: relative;
  display: inline-flex;
  align-items: flex-start;
  margin: 0;
  cursor: pointer;
  user-select: none;
  border-radius: var(--border-radius);
  padding-bottom: 5px;
  height: 24px;
}
</style>
