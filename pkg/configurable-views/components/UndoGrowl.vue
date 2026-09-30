<script setup lang="ts">
/**
 * A success growl with one action on it, for a delete that is offered back rather than confirmed
 * first. Drawn like the shell's GrowlManager growls, in the same corner: the shell's growl has no
 * action of its own
 */
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

defineProps<{
  title: string;
  message: string;
}>();

const emit = defineEmits<{
  undo: [];
  close: [];
}>();

const store = useStore();
const { t } = useI18n(store);
</script>

<template>
  <teleport to="body">
    <div class="growl-container">
      <div
        role="alert"
        class="growl bg-success"
        data-testid="configurable-views-undo-growl"
      >
        <div class="growl-message">
          <div class="icon-container">
            <i class="icon icon-checkmark" />
          </div>
          <div class="growl-text">
            <i
              class="close hand icon icon-close"
              @click="emit('close')"
            />
            <div class="growl-text-title">
              {{ title }}
            </div>
            <p class="has-title">
              {{ message }}
            </p>
            <button
              type="button"
              class="growl-action"
              data-testid="configurable-views-undo"
              @click="emit('undo')"
            >
              {{ t('configurableViews.bar.undo') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style lang="scss" scoped>
// GrowlManager's own styles, which are scoped to it
.growl-container {
  z-index: 1000;
  position: fixed;
  top: var(--header-height);
  right: 0;
  width: 100%;

  @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
    width: 420px;
  }
}

.growl {
  border-radius: var(--border-radius);
  margin: 10px;
  position: relative;
  box-shadow: 0 3px 5px 0px var(--shadow);

  .icon-container {
    align-self: center;
    flex-basis: 10%;
    padding: 10px 20px 10px 10px;

    i {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  }

  .growl-message {
    display: flex;

    .growl-text {
      position: relative;
      flex-basis: 90%;
      padding: 10px 10px 10px 0;
      word-break: break-word;
      white-space: normal;

      .close {
        position: absolute;
        top: 12px;
        right: 10px;
      }

      .growl-text-title {
        font-size: 16px;
      }

      > p {
        padding-top: 2px;
        margin-top: 5px;
      }
    }
  }
}

.growl-action {
  margin-top: 8px;
  padding: 0;
  min-height: 0;
  border: none;
  background: none;
  color: inherit;
  font-weight: 600;
  line-height: 20px;
  text-decoration: underline;
  cursor: pointer;

  &:focus-visible {
    @include focus-outline;
    outline-offset: 2px;
  }
}
</style>
