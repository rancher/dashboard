<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import ColorInput from '@shell/components/form/ColorInput';
import TypeDescription from '@shell/components/TypeDescription';

import { Checkbox } from '@components/Form/Checkbox';
import FileSelector from '@shell/components/form/FileSelector';
import SimpleBox from '@shell/components/SimpleBox';
import Loading from '@shell/components/Loading';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';
import { allHash } from '@shell/utils/promise';
import { MANAGEMENT } from '@shell/config/types';
import { getVendor, setVendor } from '@shell/config/private-label';
import { SETTING, fetchOrCreateSetting } from '@shell/config/settings';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { setFavIcon } from '@shell/utils/favicon';

const Color = require('color');

export default {
  layout: 'authenticated',

  components: {
    LabeledInput, Checkbox, FileSelector, Loading, SimpleBox, AsyncButton, Banner, ColorInput, TypeDescription
  },

  async fetch() {
    const hash = await allHash({
      uiPLSetting:            this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.PL }),
      uiLogoDarkSetting:      fetchOrCreateSetting(this.$store, SETTING.LOGO_DARK, ''),
      uiLogoLightSetting:     fetchOrCreateSetting(this.$store, SETTING.LOGO_LIGHT, ''),
      uiColorSetting:         fetchOrCreateSetting(this.$store, SETTING.PRIMARY_COLOR, ''),
      uiLinkColorSetting:     fetchOrCreateSetting(this.$store, SETTING.LINK_COLOR, ''),
      uiFaviconSetting:       fetchOrCreateSetting(this.$store, SETTING.FAVICON, ''),
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
    if (hash.uiFaviconSetting.value) {
      try {
        this.uiFavicon = hash.uiFaviconSetting.value;

        this.customizeFavicon = true;
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

      uiLogoDarkSetting:  {},
      uiLogoDark:         '',
      uiLogoLightSetting: {},
      uiLogoLight:        '',
      customizeLogo:      false,

      uiFaviconSetting:   {},
      uiFavicon:          '',
      customizeFavicon:   false,

      uiColorSetting:     {},
      uiColor:            null,
      customizeColor:     false,
      uiLinkColorSetting: {},
      uiLinkColor:        null,
      customizeLinkColor: false,

      errors: [],

    };
  },

  computed: {
    mode() {
      const schema = this.$store.getters[`management/schemaFor`](MANAGEMENT.SETTING);

      return schema?.resourceMethods?.includes('PUT') ? _EDIT : _VIEW;
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
    updateLogo(img, key) {
      this[key] = img;
    },

    setError(e) {
      this.errors = [];
      this.errors.push(e);
    },

    async save(btnCB) {
      this.uiPLSetting.value = this.uiPLSetting.value.replaceAll(/[\<>&=#()"]/gm, '');

      if (this.customizeLogo) {
        this.uiLogoLightSetting.value = this.uiLogoLight;
        this.uiLogoDarkSetting.value = this.uiLogoDark;
      } else {
        this.uiLogoLightSetting.value = '';
        this.uiLogoDarkSetting.value = '';
      }

      if (this.customizeFavicon) {
        this.uiFaviconSetting.value = this.uiFavicon;
      } else {
        this.uiFaviconSetting.value = '';
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
          this.uiLogoDarkSetting.save(),
          this.uiLogoLightSetting.save(),
          this.uiColorSetting.save(),
          this.uiLinkColorSetting.save(),
          this.uiFaviconSetting.save()
        ]);
        if (this.uiPLSetting.value !== this.vendor) {
          setVendor(this.uiPLSetting.value);
        }

        setFavIcon(this.$store);
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
    <TypeDescription resource="branding" />
    <div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput v-model="uiPLSetting.value" :label="t('branding.uiPL.label')" :mode="mode" :maxlength="100" />
        </div>
      </div>
      <h3 class="mt-20 mb-5 pb-5">
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

      <h3 class="mt-20 mb-5 pb-5">
        {{ t('branding.favicon.label') }}
      </h3>
      <label class="text-label">
        {{ t('branding.favicon.tip', {}, true) }}
      </label>

      <div class="row mt-10 mb-20">
        <Checkbox v-model="customizeFavicon" :label="t('branding.favicon.useCustom')" :mode="mode" />
      </div>

      <div v-if="customizeFavicon" class="row mb-20">
        <div class="col logo-container span-12">
          <div class="mb-10">
            <FileSelector
              :byte-limit="20000"
              :read-as-data-url="true"
              class="role-secondary"
              :label="t('branding.favicon.upload')"
              :mode="mode"
              @error="setError"
              @selected="updateLogo($event, 'uiFavicon')"
            />
          </div>
          <SimpleBox v-if="uiFavicon">
            <label class="text-muted">{{ t('branding.favicon.preview') }}</label>
            <img class="logo-preview" :src="uiFavicon" />
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
            {{ t('branding.linkColor.example') }}
          </a>
        </span>
      </div>
    </div>
    <template v-for="err in errors">
      <Banner :key="err" color="error" :label="err" />
    </template>
    <div v-if="mode === 'edit'">
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
</style>
