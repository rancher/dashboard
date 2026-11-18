<script lang="ts">
import { defineComponent, PropType, inject } from 'vue';
import typeHelper from '@shell/utils/type-helpers';
import { announce } from '@shell/utils/aria-announce';

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
     * Announce phase changes to screen readers (WCAG 2.2 SC 4.1.3). The visual feedback -
     * spinner, tick, label swap - is otherwise silent, because changing the accessible name of
     * the element that currently has focus is not reliably read out. Turn this off where the
     * surrounding page already announces the outcome, so it isn't said twice.
     */
    announceStatus: {
      type:    Boolean,
      default: true,
    },

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
    },

    phase(neu: string) {
      // Falling back to `action` when the success/error timer lapses is not a status change.
      if ( !this.announceStatus || neu === ASYNC_BUTTON_STATES.ACTION ) {
        return;
      }

      // Polite throughout, including errors: those also surface in a `role="alert"` banner or
      // growl, and an assertive announcement here would interrupt to say the same thing twice.
      announce(this.announcementFor(neu));
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

      if ( this.icon ) {
        out = this.icon;
      } else if ( exists(key) ) {
        out = `icon-${ t(key) }`;
      } else if ( exists(defaultKey) ) {
        out = `icon-${ t(defaultKey) }`;
      }

      if ( this.isSpinning ) {
        if ( !out ) {
          out = 'icon-spinner';
        }

        out += ' icon-spin';
      }

      return out;
    },

    displayLabel(): string {
      return this.labelFor(this.phase);
    },

    /**
     * A stable accessible name for the button, anchored to the action-phase label.
     *
     * VoiceOver (and JAWS/NVDA) track the accessible name of the focused element in real
     * time. Without this, every phase transition mutates the button's accessible name and
     * the screen reader re-reads it — most visibly when the 5-second timer resets the button
     * from "Applied" back to "Apply" while focus is still there.
     *
     * Binding this as `aria-label` keeps the accessible name constant across all phases so
     * focus tracking stays quiet. The live region in `announce()` handles the phase
     * announcements instead. Falls back to `undefined` (no attribute) when there is no
     * action label (icon-only refresh buttons, for example), maintaining current behaviour.
     * A parent that explicitly passes `aria-label` as a prop/attr will override this via
     * Vue 3's fallthrough attribute precedence.
     */
    stableAriaLabel(): string {
      return this.labelFor(ASYNC_BUTTON_STATES.ACTION);
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
    labelFor(phase: string): string {
      const override = typeHelper.memberOfComponent(this, `${ phase }Label`);
      const exists = this.$store.getters['i18n/exists'];
      const t = this.$store.getters['i18n/t'];
      const key = `asyncButton.${ this.mode }.${ phase }`;
      const defaultKey = `asyncButton.default.${ phase }`;

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

    /**
     * Text to read out for a phase. The visible label is not always usable on its own: the
     * `refresh` modes render no text at all, and some callers pass the same label to every
     * phase so the button doesn't resize part way through the action.
     */
    announcementFor(phase: string): string {
      const exists = this.$store.getters['i18n/exists'];
      const t = this.$store.getters['i18n/t'];

      // 1. Wording written for this mode.
      const modeKey = `asyncButton.${ this.mode }.${ phase }Announcement`;

      if ( exists(modeKey) ) {
        return t(modeKey);
      }

      // 2. The label the button now shows, where it actually says something new.
      const phaseLabel = this.labelFor(phase);
      const actionLabel = this.labelFor(ASYNC_BUTTON_STATES.ACTION);

      if ( phaseLabel && phaseLabel !== actionLabel ) {
        return phaseLabel;
      }

      // 3. A generic status, named after the action where there is one. Guarded by `exists`
      // so a newer @rancher/shell inside an older Rancher, which won't have these keys, stays
      // silent rather than announcing a raw translation key.
      const genericKey = `asyncButton.announcement.${ actionLabel ? 'withLabel.' : '' }${ phase }`;

      return exists(genericKey) ? t(genericKey, { label: actionLabel }) : '';
    },

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
    :tabindex="tabIndex"
    :data-testid="componentTestid + '-async-button'"
    :aria-label="stableAriaLabel || undefined"
    @click="clicked"
  >
    <span
      v-if="isManualRefresh"
      :class="{'mr-10': displayIcon && size !== 'sm', 'mr-5': displayIcon && size === 'sm'}"
    >{{ t('action.refresh') }}</span>
    <i
      v-if="displayIcon"
      v-clean-tooltip="tooltip"
      :class="{icon: true, 'icon-lg': true, [displayIcon]: true, 'mr-0': isManualRefresh}"
      :alt="t('asyncButton.alt.iconAlt')"
    />
    <span
      v-if="labelAs === 'text' && displayLabel"
      v-clean-tooltip="tooltip"
      v-clean-html="displayLabel"
      data-testid="async-btn-display-label"
    />
  </button>
</template>

<style lang="scss" scoped>
// refresh mode has icon + text. We need to fix the positioning of the icon and sizing
.manual-refresh i {
  margin: 0 0 0 8px !important;
  font-size: 1rem !important;
}
</style>
