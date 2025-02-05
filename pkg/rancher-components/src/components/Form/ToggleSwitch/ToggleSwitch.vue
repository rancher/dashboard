<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount, useTemplateRef } from 'vue';

type StateType = boolean | 'true' | 'false' | undefined;

export default defineComponent({
  props: {
    value: {
      type:    [Boolean, String, Number],
      default: false
    },

    offValue: {
      type:    [Boolean, String, Number],
      default: false,
    },

    onValue: {
      type:    [Boolean, String, Number],
      default: true,
    },

    offLabel: {
      type:    String,
      default: '',
    },

    onLabel: {
      type:    String,
      default: '',
    },
  },

  emits: ['update:value'],

  setup() {
    const switchChrome = useTemplateRef<HTMLElement>('switchChrome');
    const focus = () => {
      switchChrome.value?.classList.add('focus');
    };

    const blur = () => {
      switchChrome.value?.classList.remove('focus');
    };

    const switchInput = useTemplateRef<HTMLInputElement>('switchInput');

    onMounted(() => {
      switchInput.value?.addEventListener('focus', focus);
      switchInput.value?.addEventListener('blur', blur);
    });

    onBeforeUnmount(() => {
      switchInput.value?.removeEventListener('focus', focus);
      switchInput.value?.removeEventListener('blur', blur);
    });
  },

  data() {
    return { state: false as StateType };
  },

  watch: {
    value: {
      handler() {
        this.state = this.value === this.onValue;
      },
      immediate: true
    }
  },

  methods: {
    toggle(neu: StateType | null) {
      this.state = neu === null ? !this.state : neu;
      this.$emit('update:value', this.state ? this.onValue : this.offValue);
    }
  }
});
</script>

<template>
  <span class="toggle-container">
    <span
      class="label no-select hand"
      :class="{ active: !state}"
      @click="toggle(false)"
    >{{ offLabel }}</span>
    <label class="switch hand">
      <input
        ref="switchInput"
        type="checkbox"
        role="switch"
        :checked="state"
        :aria-label="onLabel"
        @input="toggle(null)"
        @keydown.enter="toggle(null)"
      >
      <span
        ref="switchChrome"
        class="slider round"
      />
    </label>
    <span
      class="label no-select hand"
      :class="{ active: state}"
      @click="toggle(true)"
    >{{ onLabel }}</span>
  </span>
</template>

<style lang="scss" scoped>
$toggle-height: 16px;

.toggle-container {
  align-items: center;
  display: flex;

  span:first-child {
    padding-right: 6px;
  }
  span:last-child {
    padding-left: 6px;
  }
}
/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: $toggle-height + 8px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--checkbox-disabled-bg);
  -webkit-transition: .4s;
  transition: .4s;

  &.focus {
    @include focus-outline;
    outline-offset: 2px;
    -webkit-transition: 0s;
    transition: 0s;
  }
}

.slider:before {
  position: absolute;
  content: "";
  height: $toggle-height;
  width: $toggle-height;
  left: 4px;
  bottom: 4px;
  background-color: var(--checkbox-tick);
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: var(--checkbox-ticked-bg);
}

input:focus + .slider {
  box-shadow: 0 0 1px var(--checkbox-ticked-bg);
}

input:checked + .slider:before {
  transform: translateX(24px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>
