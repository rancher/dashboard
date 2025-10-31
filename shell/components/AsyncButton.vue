<script lang="ts">
import { defineComponent, PropType, inject } from 'vue';
import typeHelper from '@shell/utils/type-helpers';

export const ASYNC_BUTTON_STATES = {
  ACTION:  'action',
  WAITING: 'waiting',
  SUCCESS: 'success',
  ERROR:   'error',
};

const TEXT = 'text';
const TOOLTIP = 'tooltip';
const DISABLED_CLASS_STYLE = 'btn-disabled';

export type AsyncButtonCallback = (success: boolean) => void;

interface NonReactiveProps {
  timer: NodeJS.Timeout | undefined;
}

const provideProps: NonReactiveProps = { timer: undefined };

// i18n-uses asyncButton.*
export default defineComponent({
  props: {
    /**
     * Mode maps to keys in asyncButton.* translations
     */
    mode: {
      type:    String,
      default: 'edit',
    },
    delay: {
      type:    Number,
      default: 5000,
    },

    name: {
      type:    String,
      default: null,
    },
    disabled: {
      type:    Boolean,
      default: false,
    },
    type: {
      type:    String as PropType<'button' | 'submit' | 'reset' | undefined>,
      default: 'button'
    },
    tabIndex: {
      type:    Number,
      default: null,
    },

    actionColor: {
      type:    String,
      default: 'role-primary',
    },
    waitingColor: {
      type:    String,
      default: 'bg-primary',
    },
    successColor: {
      type:    String,
      default: 'bg-success',
    },
    errorColor: {
      type:    String,
      default: 'bg-error',
    },

    actionLabel: {
      type:    String,
      default: null,
    },
    waitingLabel: {
      type:    String,
      default: null,
    },
    successLabel: {
      type:    String,
      default: null,
    },
    errorLabel: {
      type:    String,
      default: null,
    },

    icon: {
      type:    String,
      default: null,
    },
    labelAs: {
      type:    String,
      default: TEXT,
    },
    size: {
      type:    String,
      default: '',
    },

    currentPhase: {
      type:    String,
      default: ASYNC_BUTTON_STATES.ACTION,
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'action-button'
    },

    manual: {
      type:    Boolean,
      default: false,
    },

    /**
     * If true, the button will only show the icon in smaller views and hides the label.
     */
    showOnlyIconInSmallView: {
      type:    Boolean,
      default: false,
    },

    /**
     * If true, the 'icon' prop will be used for all button states (action, waiting, success, error),
     * overriding any state-specific icons defined in translations.
     * This is useful for buttons that need a static icon regardless of their phase, like Copy to Clipboard.
     */
    persistentIcon: {
      type:    Boolean,
      default: false,
    }
  },

  setup() {
    const timer = inject('timer', provideProps.timer);

    return { timer };
  },

  emits: ['click'],

  data() {
    return { phase: this.currentPhase };
  },

  watch: {
    currentPhase(neu) {
      this.phase = neu;
    }
  },

  computed: {
    classes(): {btn: boolean, [color: string]: boolean} {
      const key = `${ this.phase }Color`;
      const color = typeHelper.memberOfComponent(this, key);

      const out = {
        btn:     true,
        [color]: true,
      };

      if (this.size) {
        out[`btn-${ this.size }`] = true;
      }

      // while we are waiting for the async button to get
      // it's callback we want to the button to appear as disabled
      // but not being actually disabled as need it to be
      // able to return the keyboard navigation focus back to it
      // which can't be done while actually disabled, as per
      // https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols
      if (this.phase === ASYNC_BUTTON_STATES.WAITING) {
        out[DISABLED_CLASS_STYLE] = true;
      }

      // used to assist e2e testing mostly when waiting for button to return
      // to it's normal state/phase
      if (this.phase === ASYNC_BUTTON_STATES.ACTION) {
        out['ready-for-action'] = true;
      }

      if (this.showOnlyIconInSmallView) {
        out['show-only-icon-in-small-view'] = true;
      }

      return out;
    },

    appearsDisabled(): boolean {
      return this.disabled || this.phase === ASYNC_BUTTON_STATES.WAITING;
    },

    displayIcon(): string {
      const exists = this.$store.getters['i18n/exists'];
      const t = this.$store.getters['i18n/t'];
      const key = `asyncButton.${ this.mode }.${ this.phase }Icon`;
      const defaultKey = `asyncButton.default.${ this.phase }Icon`;

      let out = '';

      // If persistentIcon is true, the icon prop always takes precedence
      // This ensures a static icon is displayed across all phases
      if ( this.persistentIcon && this.icon ) {
        out = this.icon;
      } else {
        // Otherwise, prioritize state-specific icons from translations
        // This allows for dynamic icons based on the button's current phase (e.g., spinner for waiting).
        if ( exists(key) ) {
          out = `icon-${ t(key) }`;
        } else if ( exists(defaultKey) ) {
          out = `icon-${ t(defaultKey) }`;
        } else if ( this.icon ) {
          // Fallback to the generic icon prop if no state-specific translated icon is found
          out = this.icon;
        }
      }

      // Add spinning animation for the waiting phase, unless the icon is persistent.
      if ( this.isSpinning && !this.persistentIcon ) {
        // If there's no icon at all, default to a spinner icon for the waiting state.
        if ( !out ) {
          out = 'icon-spinner';
        }

        out += ' icon-spin';
      }

      return out;
    },

    displayLabel(): string {
      const override = typeHelper.memberOfComponent(this, `${ this.phase }Label`);
      const exists = this.$store.getters['i18n/exists'];
      const t = this.$store.getters['i18n/t'];
      const key = `asyncButton.${ this.mode }.${ this.phase }`;
      const defaultKey = `asyncButton.default.${ this.phase }`;

      if ( override ) {
        return override;
      } else if ( exists(key) ) {
        return t(key);
      } else if ( exists(defaultKey) ) {
        return t(defaultKey);
      } else {
        return '';
      }
    },

    isSpinning(): boolean {
      return this.phase === ASYNC_BUTTON_STATES.WAITING;
    },

    isManualRefresh() {
      return this.mode === 'manual-refresh';
    },

    tooltip(): { content: string, hideOnTargetClick: boolean} | null {
      if ( this.labelAs === TOOLTIP ) {
        return {
          content:           this.displayLabel,
          hideOnTargetClick: false
        };
      }

      return null;
    }
  },

  beforeUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  },

  methods: {
    clicked() {
      if ( this.appearsDisabled ) {
        return;
      }

      if (this.timer) {
        clearTimeout(this.timer);
      }

      // If manual property is set, don't automatically change the button on click
      if (!this.manual) {
        this.phase = ASYNC_BUTTON_STATES.WAITING;
      }

      const cb: AsyncButtonCallback = (success) => {
        this.done(success);
      };

      this.$emit('click', cb);
    },

    done(success: boolean | 'cancelled') {
      if (success === 'cancelled') {
        this.phase = ASYNC_BUTTON_STATES.ACTION;
      } else {
        this.phase = (success ? ASYNC_BUTTON_STATES.SUCCESS : ASYNC_BUTTON_STATES.ERROR );
        this.timer = setTimeout(() => {
          this.timerDone();
        }, this.delay);
      }
    },

    timerDone() {
      if ( this.phase === ASYNC_BUTTON_STATES.SUCCESS || this.phase === ASYNC_BUTTON_STATES.ERROR ) {
        this.phase = ASYNC_BUTTON_STATES.ACTION;
      }
    },

    focus() {
      (this.$refs.btn as HTMLElement).focus();
    }
  }
});
</script>

<template>
  <button
    ref="btn"
    role="button"
    :class="classes"
    :name="name"
    :type="type"
    :disabled="disabled"
    :aria-disabled="appearsDisabled"
    :tab-index="tabIndex"
    :data-testid="componentTestid + '-async-button'"
    @click="clicked"
  >
    <span
      v-if="isManualRefresh"
      :class="{
        'mr-10': displayIcon && size !== 'sm',
        'mr-5': displayIcon && size === 'sm',
        'manual-refresh-label': true
      }"
    >{{ t('action.refresh') }}</span>
    <i
      v-if="displayIcon"
      v-clean-tooltip="tooltip"
      :class="{
        icon: true,
        'icon-lg': true,
        [displayIcon]: true,
        'mr-0': isManualRefresh,
        'async-button-icon': true
      }"
      :alt="t('asyncButton.alt.iconAlt')"
    />
    <span
      v-if="labelAs === 'text' && displayLabel"
      v-clean-tooltip="tooltip"
      v-clean-html="displayLabel"
      data-testid="async-btn-display-label"
      class="async-button-label"
    />
  </button>
</template>

<style lang="scss" scoped>
// refresh mode has icon + text. We need to fix the positioning of the icon and sizing
.manual-refresh i {
  margin: 0 0 0 8px !important;
  font-size: 1rem !important;
}

@media only screen and (max-width: 1060px) {
  .show-only-icon-in-small-view {
    &.btn {
      padding: 0 4px 0 8px;
    }
    .async-button-label {
      display: none;
    }

    .async-button-icon {
      display: inline-block;
    }
  }
}</style>
