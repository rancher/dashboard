<script setup lang="ts">
/**
 * Groups a set of related dropdown items under a heading. Used in conjunction
 * with RcDropdown.
 *
 * `RcDropdown` already names the menu as a whole via its `ariaLabel` prop. This
 * component names a *subset* of the items within it, so that menus offering
 * several kinds of choice stay comprehensible.
 *
 * Example:
 *
 *  <rc-dropdown :aria-label="t('login.providers.menu')">
 *    <rc-dropdown-trigger>Choose a provider</rc-dropdown-trigger>
 *    <template #dropdownCollection>
 *      <rc-dropdown-group :label="t('login.providers.heading')">
 *        <rc-dropdown-item>Okta</rc-dropdown-item>
 *        <rc-dropdown-item>GitHub</rc-dropdown-item>
 *      </rc-dropdown-group>
 *    </template>
 *  </rc-dropdown>
 */
import { useId } from 'vue';

defineProps<{ label: string }>();

const labelId = useId();
</script>

<template>
  <div
    role="group"
    :aria-labelledby="labelId"
  >
    <div
      :id="labelId"
      class="rc-dropdown-group-label"
    >
      {{ label }}
    </div>
    <slot name="default">
      <!--Empty slot content-->
    </slot>
  </div>
</template>

<style lang="scss" scoped>
  .rc-dropdown-group-label {
    padding: 4px 8px;
    margin: 0 9px;

    color: var(--dropdown-group-text);
    font-size: 11px;
    font-weight: 600;
    line-height: 16px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }
</style>
