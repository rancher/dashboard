<script>
export default {
  props: {
    // The name of the input, for grouping
    name: {
      type:    String,
      default: ''
    },

    // The value for this option
    val: {
      required:  true,
      validator: x => true,
    },

    // The selected value...
    value: {
      required:  true,
      validator: x => true,
    },

    // The label shown next to the radio
    label: {
      type:    String,
      default: ''
    },

    disabled: {
      type:    Boolean,
      default: false
    },

    mode: {
      type:    String,
      default: 'edit',
    }
  },

  data() {
    return { isChecked: this.value === this.val };
  },

  watch: {
    value(neu) {
      this.isChecked = this.val === neu;
      if ( this.isChecked ) {
        this.$refs.custom.focus();
      }
    }
  },

  methods: {
    clicked(e) {
      if (!this.disabled) {
        if (e.srcElement?.tagName === 'A') {
          return;
        }
        this.$emit('input', this.val);
      }
    },
  }
};
</script>

<template>
  <span v-if="mode === 'view'" class="radio-view">
    <div class="text-label">
      <slot name="label">
        {{ label }}
      </slot>
    </div>
    <span>{{ val }}</span>
  </span>
  <label
    v-else
    class="radio-container"
    @keydown.enter="clicked($event)"
    @keydown.space="clicked($event)"
    @click.stop="clicked($event)"
  >
    <input
      :id="_uid+'-radio'"
      :disabled="disabled"
      :name="name"
      :value="''+val"
      :checked="isChecked"
      type="radio"
      :tabindex="-1"
      @click.stop.prevent
    />
    <span
      ref="custom"
      :class="[ disabled ? 'text-muted' : '', 'radio-custom']"
      :tabindex="disabled ? -1 : 0"
      :aria-label="label"
      :aria-checked="isChecked"
      role="radio"
    />
    <span
      v-if="label"
      :class="[ disabled ? 'text-muted' : '', 'radio-label']"
      v-html="label"
    >
      <slot name="label">{{ label }}</slot>
    </span>
  </label>
</template>

<style lang='scss'>
.radio-view {
  display: flex;
  flex-direction: column;
  LABEL {
    color: var(--input-label)
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
  align-items: center;
  margin: 0;
  cursor: pointer;
  user-select: none;
  border-radius: var(--border-radius);
  padding-bottom: 5px;

  .radio-label {
    color: var(--input-label);
    margin: 3px 10px 0px 5px;
  }

 .radio-custom {
    height: 14px;
    width: 14px;
    min-height: 14px;
    min-width: 14px;
    background-color: var(--input-bg);
    border-radius: 50%;
    transition: all 0.3s ease-out;
    border: 1.5px solid var(--border);

    &:focus {
      outline: none;
      border-radius: 50%;
    }
  }

  input {
    display: none;
  }

  .radio-custom {
    &[aria-checked="true"] {
      background-color: var(--dropdown-text);
      -webkit-transform: rotate(0deg) scale(1);
      -ms-transform: rotate(0deg) scale(1);
      transform: rotate(0deg) scale(1);
      opacity:1;
      border: 1.5px solid var(--dropdown-text);
    }
  }

  input:disabled ~ .radio-custom {
    background-color: var(--disabled-bg);
  }
}

</style>
