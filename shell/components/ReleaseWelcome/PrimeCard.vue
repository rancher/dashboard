<script setup lang="ts">
// The card looks the same in every theme and brand: theme-dark provides the base variables and
// theme-suse-prime (shell/assets/styles/themes/_suse-prime.scss) applies the SUSE Rancher Prime colours on top
</script>

<template>
  <section class="prime-card theme-dark theme-suse-prime">
    <slot />
  </section>
</template>

<style lang="scss" scoped>
.prime-card {
  // Sized for the call to action: 12px text on a 38px tall button
  --rc-button-padding: 11px 32px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding: 22px 24px;
  border-radius: 14px;
  background: var(--body-bg);
  // The text colour is inherited from the body, so it has to be set again from the theme variables
  color: var(--body-text);

  :slotted(h3) {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
    line-height: 28px;
    color: var(--body-text);
  }

  :slotted(p) {
    margin: 0;
    font-size: 14px;
    line-height: 22px;
    color: var(--muted);
  }

  :slotted(a:not(.btn)) {
    color: var(--link);
  }
}
</style>
