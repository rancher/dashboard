<script lang="ts">
import Vue from 'vue';
import typeHelper from '@shell/utils/type-helpers';

const ACTION = 'action';
const WAITING = 'waiting';
const SUCCESS = 'success';
const ERROR = 'error';

const TEXT = 'text';
const TOOLTIP = 'tooltip';

export type AsyncButtonCallback = (success: boolean) => void;

export default Vue.extend({
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
      type:    String,
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
    }
  },

  data(): { phase: string, timer?: NodeJS.Timeout} {
    return { phase: ACTION };
  },

  computed: {
    classes(): {btn: boolean, [color: string]: boolean} {
      const key = `${ this.phase }Color`;
      const color = typeHelper.memberOfComponent(this, key);

      const out = {
        btn:      true,
        [color]:  true,
      };

      if (this.size) {
        out[`btn-${ this.size }`] = true;
      }

      return out;
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
      return this.phase === WAITING;
    },

    isDisabled(): boolean {
      return this.disabled || this.phase === WAITING;
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

  methods: {
    clicked($event: MouseEvent) {
      if ($event) {
        $event.stopPropagation();
        $event.preventDefault();
      }

      if ( this.isDisabled ) {
        return;
      }

      if (this.timer) {
        clearTimeout(this.timer);
      }

      this.phase = WAITING;

      const cb: AsyncButtonCallback = (success) => {
        this.done(success);
      };

      this.$emit('click', cb);
    },

    done(success: boolean) {
      this.phase = (success ? SUCCESS : ERROR );
      this.timer = setTimeout(() => {
        this.timerDone();
      }, this.delay );
    },

    timerDone() {
      if ( this.phase === SUCCESS || this.phase === ERROR ) {
        this.phase = ACTION;
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
    :class="classes"
    :name="name"
    :type="type"
    :disabled="isDisabled"
    :tab-index="tabIndex"
    @click="clicked"
  >
    <i
      v-if="displayIcon"
      v-tooltip="tooltip"
      :class="{icon: true, 'icon-lg': true, [displayIcon]: true, 'pr-5': true}"
    />
    <span
      v-if="labelAs === 'text' && displayLabel"
      v-tooltip="tooltip"
      v-html="displayLabel"
    />
  </button>
</template>
