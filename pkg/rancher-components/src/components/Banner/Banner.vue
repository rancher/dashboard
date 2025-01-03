<script lang="ts">
import { defineComponent } from 'vue';
import { nlToBr } from '@shell/utils/string';
import { stringify } from '@shell/utils/error';

export default defineComponent({
  props: {
    /**
     * A color class that represents the color of the banner.
     * @values primary, secondary, success, warning, error, info
     */
    color: {
      type:    String,
      default: 'secondary'
    },
    /**
     * The label to display as the banner's default content.
     */
    label: {
      type:    [String, Error, Object],
      default: null
    },
    /**
     * The i18n key for the label to display as the banner's default content.
     */
    labelKey: {
      type:    String,
      default: null
    },
    /**
     * Add icon for the banner
     */
    icon: {
      type:    String,
      default: null
    },
    /**
     * Toggles the banner's close button.
     */
    closable: {
      type:    Boolean,
      default: false
    },
    /**
     * Toggles the stacked class for the banner.
     */
    stacked: {
      type:    Boolean,
      default: false
    }
  },
  emits:    ['close'],
  computed: {
    /**
     * Return message text as label.
     */
    messageLabel(): string | void {
      return !(typeof this.label === 'string') ? stringify(this.label) : undefined;
    }
  },
  methods: { nlToBr }
});
</script>
<template>
  <div
    class="banner"
    :class="{
      [color]: true,
    }"
    role="banner"
  >
    <div
      v-if="icon"
      class="banner__icon"
      data-testid="banner-icon"
    >
      <i
        class="icon icon-2x"
        :class="icon"
      />
    </div>
    <div
      class="banner__content"
      data-testid="banner-content"
      :class="{
        closable,
        stacked,
        icon
      }"
    >
      <slot>
        <t
          v-if="labelKey"
          :k="labelKey"
          :raw="true"
        />
        <span v-else-if="messageLabel">{{ messageLabel }}</span>
        <span
          v-else
          v-clean-html="nlToBr(label)"
        />
      </slot>
      <div
        v-if="closable"
        class="banner__content__closer"
        tabindex="0"
        role="button"
        :aria-label="t('generic.close')"
        @click="$emit('close')"
        @keyup.enter="$emit('close')"
        @keyup.space="$emit('close')"
      >
        <i
          data-testid="banner-close"
          class="icon icon-close closer-icon"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$left-border-size: 4px;
$icon-size: 24px;

.banner {
  display: flex;
  margin: 15px 0;
  position: relative;
  width: 100%;
  color: var(--body-text);

  &__icon {
    width: $icon-size * 2;
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: content-box;

    .primary & {
      background: var(--primary);
    }

    .secondary & {
      background: var(--default);
    }

    .success & {
      background: var(--success);
    }

    .info & {
      background: var(--info);
    }

    .warning & {
      background: var(--warning);
    }

    .error & {
      background: var(--error);
      color: var(--primary-text);
    }
  }

  &__content {
    padding: 10px;
    transition: all 0.2s ease;
    line-height: 20px;
    width: 100%;
    border-left: solid $left-border-size transparent;
    display: flex;
    gap: 3px;

    .primary & {
      background: var(--primary);
      border-color: var(--primary);
    }

    .secondary & {
      background: var(--default-banner-bg);
      border-color: var(--default);
    }

    .success & {
      background: var(--success-banner-bg);
      border-color: var(--success);
    }

    .info & {
      background: var(--info-banner-bg);
      border-color: var(--info);
    }

    .warning & {
      background: var(--warning-banner-bg);
      border-color: var(--warning);
    }

    .error & {
      background: var(--error-banner-bg);
      border-color: var(--error);
      color: var(--error);
    }

    &.stacked {
      padding: 0 10px;
      margin: 0;
      transition: none;
      &:first-child {
        padding-top: 10px;
      }
      &:last-child {
        padding-bottom: 10px;
      }
    }

    &.closable {
      padding-right: $icon-size * 2;
    }

    &__closer {
      display: flex;
      align-items: center;

      cursor: pointer;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: $icon-size;
      line-height: $icon-size;
      text-align: center;
      outline: none;

      .closer-icon {
        opacity: 0.7;

        &:hover {
          opacity: 1;
          color: var(--link);
        }
      }

      &:focus-visible i {
        @include focus-outline;
        outline-offset: 2px;
      }
    }

    &.icon {
      border-left: none;
    }
  }
}
</style>
