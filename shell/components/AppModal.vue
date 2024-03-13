<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name:  'AppModal',
  props: {
    /**
     * If set to false, it will not be possible to close modal by clicking on
     * the background or by pressing Esc key.
     */
    clickToClose: {
      type:    Boolean,
      default: true,
    },
    /**
     * Width in pixels or percents (50, "50px", "50%").
     *
     * Supported string values are <number>% and <number>px
     */
    width: {
      type:    [Number, String],
      default: 600,
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleEscapeKey);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleEscapeKey);
  },
  methods: {
    handleClickOutside(event: MouseEvent) {
      if (
        this.clickToClose &&
        this.$refs.modalRef &&
        !(this.$refs.modalRef as HTMLElement).contains(event.target as Node)
      ) {
        this.$emit('close');
      }
    },
    handleEscapeKey(event: KeyboardEvent) {
      if (this.clickToClose && event.key === 'Escape') {
        this.$emit('close');
      }
    }
  }
});
</script>

<template>
  <mounting-portal
    mountTo="#modals"
    name="source"
    append
  >
    <transition
      name="modal-fade"
      appear
    >
      <div
        class="modal-overlay"
        @click="handleClickOutside"
      >
        <div
          ref="modalRef"
          class="modal-container"
          :style="{ width: width }"
          @click.stop
        >
          <slot><!--Empty content--></slot>
        </div>
      </div>
    </transition>
  </mounting-portal>
</template>

<style lang="scss">
  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--overlay-bg);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 20;

    .modal-container {
      background-color: var(--modal-bg);
      border-radius: var(--border-radius);
      max-height: 95vh;
      overflow: scroll;
      max-height: 100vh;
      border: 2px solid var(--modal-border);
    }
  }

  .modal-fade-enter-active,
  .modal-fade-leave-active {
    transition: opacity 200ms;
  }

  .modal-fade-enter,
  .modal-fade-leave-to {
    opacity: 0;
  }
</style>
