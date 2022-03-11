<script>
export default {
  props: {
    to: {
      type:     String,
      required: true
    },

    prefix: {
      type:    String,
      default: ''
    },

    suffic: {
      type:    String,
      default: ''
    },

    middle: {
      type:    String,
      default: ''
    },

    prefixLabel: {
      type:    String,
      default: ''
    },

    sufficLabel: {
      type:    String,
      default: ''
    },

    middleLabel: {
      type:    String,
      default: ''
    },

    target: {
      type:    String,
      default: 'self'
    }
  }
};
</script>

<template>
  <div>
    <slot name="prefix">
      <t v-if="prefixLabel" :k="prefixLabel" :raw="true" />
      {{ prefix }}
    </slot>
    <nuxt-link :to="to" :target="target">
      <slot name="middle">
        <t v-if="middleLabel" :k="middleLabel" :raw="true" />
        {{ middle }}
      </slot>
    </nuxt-link>
    <slot name="suffic">
      <t v-if="sufficLabel" :k="sufficLabel" :raw="true" />
      {{ suffic }}
    </slot>
  </div>
</template>
