<script>
export default {
  props: {
    to: {
      type:     [String, Object],
      required: true
    },

    prefix: {
      type:    String,
      default: ''
    },

    suffix: {
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

    suffixLabel: {
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
      <t
        v-if="prefixLabel"
        :k="prefixLabel"
        :raw="true"
      />
      {{ prefix }}
    </slot>
    <router-link
      :to="to"
      :target="target"
    >
      <slot name="middle">
        <t
          v-if="middleLabel"
          :k="middleLabel"
          :raw="true"
        />
        {{ middle }}
      </slot>
    </router-link>
    <slot name="suffix">
      <t
        v-if="suffixLabel"
        :k="suffixLabel"
        :raw="true"
      />
      {{ suffix }}
    </slot>
  </div>
</template>
