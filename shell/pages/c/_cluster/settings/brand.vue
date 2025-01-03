<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import ColorInput from '@shell/components/form/ColorInput';
import TypeDescription from '@shell/components/TypeDescription';

import { Checkbox } from '@components/Form/Checkbox';
import FileImageSelector from '@shell/components/form/FileImageSelector';
import SimpleBox from '@shell/components/SimpleBox';
import Loading from '@shell/components/Loading';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';
import { allHash } from '@shell/utils/promise';
import { MANAGEMENT } from '@shell/config/types';
import { getVendor, setVendor } from '@shell/config/private-label';
import { fetchOrCreateSetting } from '@shell/utils/settings';
import { SETTING } from '@shell/config/settings';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { setFavIcon } from '@shell/utils/favicon';
import TabTitle from '@shell/components/TabTitle';

const Color = require('color');

export default {
  components: {
    LabeledInput, Checkbox, FileImageSelector, Loading, SimpleBox, AsyncButton, Banner, ColorInput, TypeDescription, TabTitle
  },

  async fetch() {
    const hash = await allHash({
      uiPLSetting:                   this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.PL }),
      uiLogoDarkSetting:             fetchOrCreateSetting(this.$store, SETTING.LOGO_DARK, ''),
      uiLogoLightSetting:            fetchOrCreateSetting(this.$store, SETTING.LOGO_LIGHT, ''),
      uiBannerDarkSetting:           fetchOrCreateSetting(this.$store, SETTING.BANNER_DARK, ''),
      uiBannerLightSetting:          fetchOrCreateSetting(this.$store, SETTING.BANNER_LIGHT, ''),
      uiLoginBackgroundDarkSetting:  fetchOrCreateSetting(this.$store, SETTING.LOGIN_BACKGROUND_DARK, ''),
      uiLoginBackgroundLightSetting: fetchOrCreateSetting(this.$store, SETTING.LOGIN_BACKGROUND_LIGHT, ''),
      uiColorSetting:                fetchOrCreateSetting(this.$store, SETTING.PRIMARY_COLOR, ''),
      uiLinkColorSetting:            fetchOrCreateSetting(this.$store, SETTING.LINK_COLOR, ''),
      uiFaviconSetting:              fetchOrCreateSetting(this.$store, SETTING.FAVICON, ''),
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
    if (hash.uiBannerDarkSetting.value) {
      try {
        this.uiBannerDark = hash.uiBannerDarkSetting.value;
        this.customizeBanner = true;
      } catch {}
    }
    if (hash.uiBannerLightSetting.value) {
      try {
        this.uiBannerLight = hash.uiBannerLightSetting.value;

        this.customizeBanner = true;
      } catch {}
    }
    if (hash.uiLoginBackgroundDarkSetting.value) {
      try {
        this.uiLoginBackgroundDark = hash.uiLoginBackgroundDarkSetting.value;
        this.customizeLoginBackground = true;
      } catch {}
    }
    if (hash.uiLoginBackgroundLightSetting.value) {
      try {
        this.uiLoginBackgroundLight = hash.uiLoginBackgroundLightSetting.value;

        this.customizeLoginBackground = true;
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

      uiBannerDarkSetting:  {},
      uiBannerDark:         '',
      uiBannerLightSetting: {},
      uiBannerLight:        '',
      customizeBanner:      false,

      uiLoginBackgroundDarkSetting:  {},
      uiLoginBackgroundDark:         '',
      uiLoginBackgroundLightSetting: {},
      uiLoginBackgroundLight:        '',
      customizeLoginBackground:      false,

      uiFaviconSetting: {},
      uiFavicon:        '',
      customizeFavicon: false,

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
    },
    customLinkColor() {
      return { color: this.uiLinkColor };
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
    updateBranding(img, key) {
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

      if (this.customizeBanner) {
        this.uiBannerLightSetting.value = this.uiBannerLight;
        this.uiBannerDarkSetting.value = this.uiBannerDark;
      } else {
        this.uiBannerLightSetting.value = '';
        this.uiBannerDarkSetting.value = '';
      }

      if (this.customizeLoginBackground) {
        this.uiLoginBackgroundLightSetting.value = this.uiLoginBackgroundLight;
        this.uiLoginBackgroundDarkSetting.value = this.uiLoginBackgroundDark;
      } else {
        this.uiLoginBackgroundLightSetting.value = '';
        this.uiLoginBackgroundDarkSetting.value = '';
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
          this.uiBannerDarkSetting.save(),
          this.uiBannerLightSetting.save(),
          this.uiLoginBackgroundDarkSetting.save(),
          this.uiLoginBackgroundLightSetting.save(),
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
      <TabTitle>{{ t('branding.label') }}</TabTitle>
    </h1>
    <TypeDescription resource="branding" />
    <div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="uiPLSetting.value"
            :label="t('branding.uiPL.label')"
            :mode="mode"
            :maxlength="100"
          />
        </div>
      </div>
      <h3 class="mt-20 mb-5 pb-5">
        {{ t('branding.logos.label') }}
      </h3>
      <label class="text-label">
        {{ t('branding.logos.tip', {}, true) }}
      </label>

      <div class="row mt-10 mb-20">
        <Checkbox
          v-model:value="customizeLogo"
          :label="t('branding.logos.useCustom')"
          :mode="mode"
        />
      </div>

      <div
        v-if="customizeLogo"
        class="row mb-20"
      >
        <div class="col preview-container logo span-6">
          <div class="mb-10">
            <FileImageSelector
              :byte-limit="20000"
              :read-as-data-url="true"
              class="role-secondary"
              :label="t('branding.logos.uploadLight')"
              :mode="mode"
              accept="image/jpeg,image/png,image/svg+xml"
              @error="setError"
              @update:value="updateBranding($event, 'uiLogoLight')"
            />
          </div>
          <SimpleBox
            v-if="uiLogoLight || uiLogoDark"
            class="theme-light  mb-10"
          >
            <label class="text-muted">{{ t('branding.logos.lightPreview') }}</label>
            <img
              class="img-preview"
              data-testid="branding-logo-light-preview"
              :src="uiLogoLight ? uiLogoLight : uiLogoDark"
            >
          </SimpleBox>
        </div>
        <div class="col preview-container logo span-6">
          <div class="mb-10">
            <FileImageSelector
              :byte-limit="20000"
              :read-as-data-url="true"
              class="role-secondary"
              :label="t('branding.logos.uploadDark')"
              :mode="mode"
              accept="image/jpeg,image/png,image/svg+xml"
              @error="setError"
              @update:value="updateBranding($event, 'uiLogoDark')"
            />
          </div>
          <SimpleBox
            v-if="uiLogoDark || uiLogoLight"
            class="theme-dark  mb-10"
          >
            <label class="text-muted">{{ t('branding.logos.darkPreview') }}</label>
            <img
              class="img-preview"
              data-testid="branding-logo-dark-preview"
              :src="uiLogoDark ? uiLogoDark : uiLogoLight"
            >
          </SimpleBox>
        </div>
      </div>

      <h3 class="mt-20 mb-5 pb-5">
        {{ t('branding.banner.label') }}
      </h3>
      <label class="text-label">
        {{ t('branding.banner.tip', {}, true) }}
      </label>

      <div class="row mt-10 mb-20">
        <Checkbox
          v-model:value="customizeBanner"
          :label="t('branding.banner.useCustom')"
          :mode="mode"
        />
      </div>

      <div
        v-if="customizeBanner"
        class="row mb-20"
      >
        <div class="col preview-container banner span-6">
          <div class="mb-10">
            <FileImageSelector
              :byte-limit="200000"
              :read-as-data-url="true"
              class="role-secondary"
              :label="t('branding.banner.uploadLight')"
              :mode="mode"
              accept="image/jpeg,image/png,image/svg+xml"
              @error="setError"
              @update:value="updateBranding($event, 'uiBannerLight')"
            />
          </div>
          <SimpleBox
            v-if="uiBannerLight || uiBannerDark"
            class="theme-light mb-10"
          >
            <label class="text-muted">{{ t('branding.banner.lightPreview') }}</label>
            <img
              class="img-preview"
              data-testid="branding-banner-light-preview"
              :src="uiBannerLight ? uiBannerLight : uiBannerDark"
            >
          </SimpleBox>
        </div>
        <div class="col preview-container banner span-6">
          <div class="mb-10">
            <FileImageSelector
              :byte-limit="200000"
              :read-as-data-url="true"
              class="role-secondary"
              :label="t('branding.banner.uploadDark')"
              :mode="mode"
              accept="image/jpeg,image/png,image/svg+xml"
              @error="setError"
              @update:value="updateBranding($event, 'uiBannerDark')"
            />
          </div>
          <SimpleBox
            v-if="uiBannerDark || uiBannerLight"
            class="theme-dark  mb-10"
          >
            <label class="text-muted">{{ t('branding.banner.darkPreview') }}</label>
            <img
              class="img-preview"
              data-testid="branding-banner-dark-preview"
              :src="uiBannerDark ? uiBannerDark : uiBannerLight"
            >
          </SimpleBox>
        </div>
      </div>

      <h3 class="mt-20 mb-5 pb-5">
        {{ t('branding.loginBackground.label') }}
      </h3>
      <label class="text-label">
        {{ t('branding.loginBackground.tip', {}, true) }}
      </label>

      <div class="row mt-10 mb-20">
        <Checkbox
          v-model:value="customizeLoginBackground"
          :label="t('branding.loginBackground.useCustom')"
          :mode="mode"
        />
      </div>

      <div
        v-if="customizeLoginBackground"
        class="row mb-20"
      >
        <div class="col preview-container login-background span-6">
          <div class="mb-10">
            <FileImageSelector
              :byte-limit="200000"
              :read-as-data-url="true"
              class="role-secondary"
              :label="t('branding.loginBackground.uploadLight')"
              :mode="mode"
              accept="image/jpeg,image/png,image/svg+xml"
              @error="setError"
              @update:value="updateBranding($event, 'uiLoginBackgroundLight')"
            />
          </div>
          <SimpleBox
            v-if="uiLoginBackgroundLight || uiLoginBackgroundDark"
            class="theme-light mb-10"
          >
            <label class="text-muted">{{ t('branding.loginBackground.lightPreview') }}</label>
            <img
              class="img-preview"
              data-testid="branding-login-background-light-preview"
              :src="uiLoginBackgroundLight ? uiLoginBackgroundLight : uiLoginBackgroundDark"
            >
          </SimpleBox>
        </div>
        <div class="col preview-container login-background span-6">
          <div class="mb-10">
            <FileImageSelector
              :byte-limit="200000"
              :read-as-data-url="true"
              class="role-secondary"
              :label="t('branding.loginBackground.uploadDark')"
              :mode="mode"
              accept="image/jpeg,image/png,image/svg+xml"
              @error="setError"
              @update:value="updateBranding($event, 'uiLoginBackgroundDark')"
            />
          </div>
          <SimpleBox
            v-if="uiLoginBackgroundDark || uiLoginBackgroundLight"
            class="theme-dark  mb-10"
          >
            <label class="text-muted">{{ t('branding.loginBackground.darkPreview') }}</label>
            <img
              class="img-preview"
              data-testid="branding-login-background-dark-preview"
              :src="uiLoginBackgroundDark ? uiLoginBackgroundDark : uiLoginBackgroundLight"
            >
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
        <Checkbox
          v-model:value="customizeFavicon"
          :label="t('branding.favicon.useCustom')"
          :mode="mode"
        />
      </div>

      <div
        v-if="customizeFavicon"
        class="row mb-20"
      >
        <div class="col favicon-container span-12">
          <div class="mb-10">
            <FileImageSelector
              :byte-limit="20000"
              :read-as-data-url="true"
              class="role-secondary"
              :label="t('branding.favicon.upload')"
              :mode="mode"
              accept="image/jpeg,image/png,image/svg+xml"
              @error="setError"
              @update:value="updateBranding($event, 'uiFavicon')"
            />
          </div>
          <SimpleBox v-if="uiFavicon">
            <label class="text-muted">{{ t('branding.favicon.preview') }}</label>
            <img
              class="favicon-preview"
              data-testid="branding-favicon-preview"
              :src="uiFavicon"
            >
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
        <Checkbox
          v-model:value="customizeColor"
          :label="t('branding.color.useCustom')"
          :mode="mode"
        />
      </div>
      <div
        v-if="customizeColor"
        class="row mt-20 mb-20"
      >
        <ColorInput
          v-model:value="uiColor"
          component-testid="primary"
        />
      </div>

      <h3 class="mt-40 mb-5 pb-0">
        {{ t('branding.linkColor.label') }}
      </h3>
      <label class="text-label">
        {{ t('branding.linkColor.tip', {}, true) }}
      </label>
      <div class="row mt-20">
        <Checkbox
          v-model:value="customizeLinkColor"
          :label="t('branding.linkColor.useCustom')"
          :mode="mode"
        />
      </div>
      <div
        v-if="customizeLinkColor"
        class="row mt-20 mb-20"
      >
        <ColorInput
          v-model:value="uiLinkColor"
          class="col"
          component-testid="link"
        />
        <span class="col link-example">
          <a :style="customLinkColor">
            {{ t('branding.linkColor.example') }}
          </a>
        </span>
      </div>
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
        component-testid="branding-apply"
        class="pull-right mt-20"
        mode="apply"
        @click="save"
      />
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

:deep().preview-container {
  display: flex;
  flex-direction: column;

  .simple-box {
    position: relative;
    flex: 1;

    .content {
      height: 100%;
      display: flex;
    }

    .logo-preview {
      max-width: 100%;
    }
  }

  &.logo {
    .simple-box {
      max-height: 120px;
    }
  }

  &.banner {
    .simple-box {
      max-height: 200px;
    }
  }

  &.login-background {
    .simple-box {
      max-height: 300px;
    }
  }

  & LABEL {
    position: absolute;
    top: 10px;
    left: 10px;
  }
}
</style>
