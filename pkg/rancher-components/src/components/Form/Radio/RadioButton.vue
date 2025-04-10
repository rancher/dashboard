<script lang="ts">
import { defineComponent } from 'vue';
import { _VIEW } from '@shell/config/query-params';
import { randomStr } from '@shell/utils/string';

export default defineComponent({
  props: {
    /**
     * The name of the input, for grouping.
     */
    name: {
      type:    String,
      default: ''
    },

    /**
     * The value for this option.
     */
    val: {
      required:  true,
      validator: () => true
    },

    /**
     * The selected value.
     */
    value: {
      required:  true,
      validator: () => true
    },

    /**
     * The label shown next to the radio.
     */
    label: {
      type:    String,
      default: ''
    },

    /**
     * Disable the radio.
     */
    disabled: {
      type:    Boolean,
      default: false
    },

    /**
     * The radio editing mode.
     * @values _EDIT, _VIEW
     */
    mode: {
      type:    String,
      default: 'edit'
    },

    /**
     * The i18n key to use for the radio description.
     */
    descriptionKey: {
      type:    String,
      default: null
    },

    /**
     * The radio description.
     */
    description: {
      type:    String,
      default: null
    },

    /**
     * Prevent focus when using radio in the context of a Radio group
     */
    preventFocusOnRadioGroups: {
      type:    Boolean,
      default: false
    }
  },

  emits: ['update:value'],

  data() {
    return {
      isChecked:    this.value === this.val,
      randomString: `${ randomStr() }-radio`,
    };
  },

  computed: {
    /**
     * Determines if the radio is disabled.
     */
    isDisabled(): boolean {
      return this.mode === _VIEW || this.disabled;
    },

    /**
     * Determines if the label for the radio should be muted.
     */
    muteLabel(): boolean {
      // Don't mute the label if the mode is view and the button is checked
      return this.disabled && !(this.mode === _VIEW && this.isChecked);
    },

    /**
     * Determines if the description slot is in use.
     */
    hasDescriptionSlot(): boolean {
      return !!this.$slots.description;
    },

    hasLabelSlot(): boolean {
      return !!this.$slots.label;
    }
  },

  watch: {
    value(neu) {
      this.isChecked = this.val === neu;
      if (this.isChecked && !this.preventFocusOnRadioGroups) {
        (this.$refs.custom as HTMLElement).focus();
      }
    }
  },

  methods: {
    /**
     * Emits the input event.
     */
    clicked(event: MouseEvent | KeyboardEvent) {
      const target = event.target;

      if (this.isDisabled || (target instanceof HTMLElement && target.tagName === 'A')) {
        return;
      }

      this.$emit('update:value', this.val);
    },
  }
});
</script>

<template>
  <label
    :class="{
      'disabled': isDisabled,
      'radio-container': true,
      'radio-button-checked': isChecked
    }"
    @keydown.enter="clicked($event)"
    @keydown.space="clicked($event)"
    @click.stop="clicked($event)"
  >
    <input
      :id="randomString"
      :disabled="isDisabled"
      :name="name"
      :value="''+val"
      :data-testid="label"
      :checked="isChecked"
      type="radio"
      :tabindex="-1"
      @click.stop.prevent
    >
    <span
      ref="custom"
      :class="[ isDisabled ? 'text-muted' : '', 'radio-custom']"
      :tabindex="isDisabled || preventFocusOnRadioGroups ? -1 : 0"
      :aria-label="label"
      :aria-checked="isChecked"
      role="radio"
    />
    <div class="labeling">
      <label
        :class="[ muteLabel ? 'text-muted' : '', 'radio-label', 'm-0']"
        :for="name"
      >
        <slot
          v-if="hasLabelSlot"
          name="label"
        >
          <!-- slot content -->
        </slot>
        <span
          v-else-if="label"
          v-clean-html="label"
        />
      </label>
      <div
        v-if="descriptionKey || description"
        class="radio-button-outer-container-description"
      >
        <t
          v-if="descriptionKey"
          :k="descriptionKey"
        />
        <template v-else-if="description">
          {{ description }}
        </template>
      </div>
      <div
        v-else-if="hasDescriptionSlot"
        class="radio-button-outer-container-description"
      >
        <slot name="description" />
      </div>
    </div>
  </label>
</template>

<style lang='scss'>
$fontColor: var(--input-label);

.radio-view {
  display: flex;
  flex-direction: column;
  LABEL {
    color: var(--input-label);
  }
}

.radio-group {
  .text-label {
    display: block;
    padding-bottom: 5px;
  }
}

.radio-container {
  position: relative;
  display: inline-flex;
  align-items: flex-start;
  margin: 0;
  left: -4px;
  user-select: none;
  border-radius: var(--border-radius);
  padding-bottom: 5px;
  padding-left: 4px;

  &,
  .radio-label,
  .radio-button-outer-container-description {
    cursor: pointer;
  }

  &.disabled,
  &.disabled .radio-label,
  &.disabled .radio-button-outer-container-description {
    cursor: not-allowed
  }

 .radio-custom {
    height: 14px;
    width: 14px;
    min-height: 14px;
    min-width: 14px;
    background-color: var(--input-bg);
    border-radius: 50%;
    border: 1.5px solid var(--border);
    margin-top: 5px;
  }

  input {
    display: none;
  }

  .radio-custom {
    &[aria-checked="true"] {
      background-color: var(--primary);
      -webkit-transform: rotate(0deg) scale(1);
      -ms-transform: rotate(0deg) scale(1);
      transform: rotate(0deg) scale(1);
      opacity:1;
      border: 1.5px solid var(--primary);

      // Ensure that checked radio buttons are muted but still visibly selected when muted
      &.text-muted {
        opacity: .25;
      }
    }
  }

  input:disabled ~ .radio-custom:not([aria-checked="true"]) {
    background-color: var(--disabled-bg);
    opacity: .25;
  }

  .radio-button-outer-container-description {
    color: $fontColor;
    font-size: 11px;
    margin-top: 5px;
  }

  .labeling {
    display: inline-flex;
    flex-direction: column;

    margin: 3px 10px 0px 5px;
  }
}

</style>
