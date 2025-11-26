<script>
import { Checkbox } from '@rc/Form/Checkbox';
import ColorInput from '@shell/components/form/ColorInput';
import { LabeledInput } from '@rc/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { RadioGroup } from '@rc/Form/Radio';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { ToggleSwitch } from '@rc/Form/ToggleSwitch';
import { TextAreaAutoGrow } from '@rc/Form/TextArea';
import { Banner } from '@rc/Banner';

export default ({
  name: 'BannerSettings',

  props: {
    value: {
      type:    Object,
      default: () => {}
    },
    mode: {
      type: String,
      validator(value) {
        return [_EDIT, _VIEW].includes(value);
      },
      default: _EDIT,
    },
    bannerType: {
      type:     String,
      required: true
    }
  },

  components: {
    Banner, Checkbox, ColorInput, LabeledInput, LabeledSelect, RadioGroup, TextAreaAutoGrow, ToggleSwitch
  },

  data() {
    const showAsDialog = !!this.value[this.bannerType]?.button || false;
    const buttonText = this.value[this.bannerType]?.button || this.t('banner.showAsDialog.defaultButtonText');
    const isHtml = !!this.value[this.bannerType]?.html; // HTML display if the 'html' field is set (otherwise default is text)

    return {
      showAsDialog,
      buttonText,
      uiBannerFontSizeOptions: ['10px', '12px', '14px', '16px', '18px', '20px'],
      themeVars:               {
        bannerBgColor:   getComputedStyle(document.body).getPropertyValue('--default'),
        bannerTextColor: getComputedStyle(document.body).getPropertyValue('--banner-text-color')
      },
      bannerTitleId: `describe-banners-${ this.bannerType }-id`,
      isHtml,
    };
  },

  watch: {
    showAsDialog(neu, old) {
      if (neu !== old && !neu) {
        this.value[this.bannerType].button = '';
      } else {
        this.value[this.bannerType].button = this.buttonText;
      }
    },

    buttonText(neu, old) {
      if (neu !== old) {
        this.value[this.bannerType].button = neu;
      }
    },

    isHtml(neu, old) {
      if (neu !== old) {
        this.value[this.bannerType].isHtml = neu; // Keep track of the content type (this is not persisted)
      }
    }
  },

  computed: {
    radioOptions() {
      const options = ['left', 'center', 'right'];
      const labels = [
        this.t('banner.bannerAlignment.leftOption'),
        this.t('banner.bannerAlignment.centerOption'),
        this.t('banner.bannerAlignment.rightOption'),
      ];

      return { options, labels };
    },

    isUiDisabled() {
      return this.mode === _VIEW;
    },

    textDecorationOptions() {
      const options = [
        {
          style: 'fontWeight',
          label: this.t('banner.bannerDecoration.bannerBold')
        },
        {
          style: 'fontStyle',
          label: this.t('banner.bannerDecoration.bannerItalic')
        },
        {
          style: 'textDecoration',
          label: this.t('banner.bannerDecoration.bannerUnderline')
        }
      ];

      return options;
    },
    isConsentBanner() {
      return this.bannerType === 'bannerConsent';
    }
  }
});
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <ColorInput
          v-model:value="value[bannerType].color"
          :default-value="themeVars.bannerTextColor"
          :label="t('banner.textColor')"
          :mode="mode"
          :aria-label="`${t(`banner.${bannerType}`)} ${t('banner.textColor')}`"
        />
      </div>
      <div class="col span-6">
        <ColorInput
          v-model:value="value[bannerType].background"
          :default-value="themeVars.bannerBgColor"
          :label="t('banner.background')"
          :mode="mode"
          :aria-label="`${t(`banner.${bannerType}`)} ${t('banner.background')}`"
        />
      </div>
    </div>
    <div class="row pb-10">
      <ToggleSwitch
        v-model:value="isHtml"
        :aria-label="`${t(`banner.${bannerType}`)} ${t('banner.toggleTextHtml')}`"
        :data-testid="`banner_content_type_toggle${bannerType}`"
        :disabled="isUiDisabled"
        :off-label="t('banner.type.text')"
        :on-label="t('banner.type.html')"
      />
    </div>
    <div
      v-if="!isHtml"
      class="row"
    >
      <p
        :id="bannerTitleId"
        class="sr-only"
      >
        {{ t(`banner.${bannerType}`) }}
      </p>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value[bannerType].text"
          :disabled="isUiDisabled"
          :label="t('banner.text')"
          type="multiline"
          :aria-describedby="bannerTitleId"
        />
        <p
          v-if="isConsentBanner"
          class="banner-input-footnote mt-5 mb-20"
        >
          {{ t('banner.consentFootnote') }}
        </p>
      </div>
      <div class="col span-2">
        <RadioGroup
          v-model:value="value[bannerType].textAlignment"
          name="bannerAlignment"
          :data-testid="`banner_alignment_radio_options${bannerType}`"
          :label="t('banner.bannerAlignment.label')"
          :options="radioOptions.options"
          :labels="radioOptions.labels"
          :mode="mode"
          :aria-label="`${t(`banner.${bannerType}`)} ${t('banner.bannerAlignment.label')}`"
        />
      </div>
      <div class="col span-2">
        <h3 id="decoration-banner-title-id">
          {{ t('banner.bannerDecoration.label') }}
        </h3>
        <div
          v-for="(o, i) in textDecorationOptions"
          :key="i"
        >
          <Checkbox
            v-model:value="value[bannerType][o.style]"
            name="bannerDecoration"
            :data-testid="`banner_decoration_checkbox${bannerType}${o.label}`"
            class="banner-decoration-checkbox"
            :mode="mode"
            :label="o.label"
            :aria-describedby="`${bannerTitleId} decoration-banner-title-id`"
          />
        </div>
      </div>
      <div class="col span-2">
        <LabeledSelect
          v-model:value="value[bannerType].fontSize"
          :data-testid="`banner_font_size_options${bannerType}`"
          :disabled="isUiDisabled"
          :label="t('banner.bannerFontSize.label')"
          :options="uiBannerFontSizeOptions"
          :aria-describedby="bannerTitleId"
        />
      </div>
    </div>
    <div
      v-else
      class="row"
    >
      <div class="col span-12">
        <Banner
          :disabled="isUiDisabled"
          color="warning"
        >
          {{ t('banner.htmlWarning') }}
        </Banner>
        <TextAreaAutoGrow
          v-model:value="value[bannerType].html"
          :aria-label="`${t(`banner.${bannerType}`)} ${t('banner.htmlContent')}`"
          :data-testid="`banner_html${bannerType}`"
          :min-height="64"
          :disabled="isUiDisabled"
          :placeholder="t('banner.type.html')"
        />
      </div>
    </div>
    <div
      v-if="isConsentBanner"
      class="row"
    >
      <div class="col span-6">
        <div class="mt-10">
          <Checkbox
            v-model:value="showAsDialog"
            name="bannerShowAsDialog"
            class="banner-decoration-checkbox"
            :data-testid="`banner_show_as_dialog_checkbox${bannerType}`"
            :mode="mode"
            :label="t('banner.showAsDialog.label')"
            :tooltip="t('banner.showAsDialog.tooltip')"
            :aria-describedby="bannerTitleId"
          />
          <LabeledInput
            v-model:value="buttonText"
            :data-testid="`banner_accept_button${bannerType}`"
            :disabled="!showAsDialog || isUiDisabled"
            :label="t('banner.buttonText')"
            :aria-describedby="bannerTitleId"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang='scss'>
.banner-input-footnote {
  font-size: 12px;
  opacity: 0.8;
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
