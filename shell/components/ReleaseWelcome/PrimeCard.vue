<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// The card is dark in both themes: the theme-dark class applies the dark theme variables to the card only.
// The brand class keeps brand specific dark variables (e.g. `.suse.theme-dark`) working, like on the body
const themeClasses = computed(() => ['theme-dark', store.getters['management/brand']].filter(Boolean));
</script>

<template>
  <section
    class="prime-card"
    :class="themeClasses"
  >
    <slot />
  </section>
</template>

<style lang="scss" scoped>
.prime-card {
  // SUSE pine, the only colour the themes don't have
  --prime-card-bg: #0c322c;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding: 22px 24px;
  border-radius: 14px;
  background: var(--prime-card-bg);
  // The text colour is inherited from the body, so it has to be set again from the dark variables
  color: var(--body-text);

  :slotted(h3) {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
    line-height: 28px;
    color: var(--body-text);
  }

  // Not --muted, it doesn't have enough contrast on the pine background
  :slotted(p) {
    margin: 0;
    font-size: 14px;
    line-height: 22px;
  }

  :slotted(a:not(.btn)) {
    color: var(--link);
  }
}
</style>
