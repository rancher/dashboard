<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    /**
     * Add icon to the button
     */
    icon: {
      type:    String,
      default: null
    },

    /**
     * Add badge to the button, e.g. counter
     */
    badge: {
      type:    String,
      default: null
    },

    /**
     * Add label to the button
     */
    label: {
      type:    String,
      default: null,
      required: true
    },

    /**
     * Add tooltip to the button, both text or HTML.
     * Check v-tooltip for more info.
     */
    tooltip: {
      type:    String,
      default: null
    },

    /**
     * Define button active state
     */
     active: {
      type:    Boolean,
      default: null
    },

    role: {
      type:    String,
      default: 'tab'
    },
  },
});
</script>

<template>
  <a
    :aria-controls="'#' + label"
    :aria-selected="active"
    :role="role"
    @click.prevent="$emit('click')"
    class="button-link"
    :class="{active}"
  >
    <span v-if="label" class="button-link__label">{{ label }}</span>
    <span v-if="badge" class="button-link__badge">{{ badge }}</span>
    <i v-if="icon" v-tooltip="tooltip" class="button-link__icon icon" :class="{icon}" />
  </a>
</template>


<style lang="scss" scoped>
.button-link {
  cursor: pointer;
  color: var(--primary);

  &:hover {
    color: var(--primary);
    text-decoration: none;
  }

  &:hover &__label,
  &:hover &__badge {
    text-decoration: underline;
  }

  &.active {
    color: var(--primary);
    text-decoration: none;
  }

  &__badge {
    margin-left: 5px;
    background-color: var(--link);
    color: #fff;
    border-radius: 6px;
    padding: 1px 7px;
    font-size: 11px;
  }
}
</style>