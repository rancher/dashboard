<script>
import { _CREATE } from '@/config/query-params';

const ACTION = 'action';
const WAITING = 'waiting';
const SUCCESS = 'success';
const ERROR = 'error';

const LABEL = {
  create: {
    action:  'Create',
    waiting: 'Creating&hellip;',
    success: 'Created',
    error:   'Error',
  },
  apply: {
    action:  'Apply',
    waiting: 'Applying&hellip;',
    success: 'Applied',
    error:   'Error',
  },
  edit: {
    action:  'Save',
    waiting: 'Saving&hellip;',
    success: 'Saved',
    error:   'Error',
  },
  delete: {
    action:  'Delete',
    waiting: 'Deleting&hellip;',
    success: 'Deleted',
    error:   'Error',
  },
  continue: {
    action:  'Continue',
    waiting: 'Saving&hellip;',
    success: 'Saved',
    error:   'Error',
  },
  done: {
    action:  'Done',
    waiting: 'Saving&hellip;',
    success: 'Saved',
    error:   'Error',
  },
  enable: {
    action:  'Enable',
    waiting: 'Enabling&hellip;',
    success: 'Enabled',
    error:   'Error',
  }
};

export default {
  props: {
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
      default: 'bg-primary',
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
    showLabel: {
      type:    Boolean,
      default: true,
    },

    /**
     * Use the enabled labels instead of the default create labels
     */
    useEnableLabel: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      phase: ACTION,
      timer: null,
    };
  },

  computed: {
    classes() {
      const key = `${ this.phase }Color`;
      const color = this[key];

      const out = {
        btn:     true,
        [color]: true,
      };

      return out;
    },

    label() {
      const override = this[`${ this.phase }Label`];

      if ( override ) {
        return override;
      }

      let mode = null;

      if (this.mode === _CREATE && this.useEnableLabel) {
        mode = 'enable';
      } else {
        mode = this.mode;
      }

      return LABEL[mode] ? LABEL[mode][this.phase] : '';
    },

    isSpinning() {
      return this.phase === WAITING;
    },

    isDisabled() {
      return this.disabled || this.phase === WAITING;
    }
  },

  methods: {
    clicked($event) {
      $event.stopPropagation();
      $event.preventDefault();

      if ( this.isDisabled ) {
        return;
      }

      clearTimeout(this.timer);

      this.phase = WAITING;

      this.$emit('click', (success) => {
        this.done(success);
      });
    },

    done(success) {
      this.phase = (success ? SUCCESS : ERROR );
      this.timer = setTimeout(() => {
        this.timerDone();
      }, this.delay );
    },

    timerDone() {
      if ( this.phase === SUCCESS || this.phase === ERROR ) {
        this.phase = ACTION;
      }
    }
  }
};
</script>

<template>
  <button
    :class="classes"
    :name="name"
    :type="type"
    :disabled="isDisabled"
    :tab-index="tabIndex"
    @click="clicked"
  >
    <i v-if="isSpinning" class="icon icon-spinner icon-spin mr-5" />
    <i v-else-if="icon" :class="{icon: true, [icon]: true}" />
    <span v-show="showLabel" v-html="label" />
  </button>
</template>
