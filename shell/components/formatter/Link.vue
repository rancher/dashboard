<script>
import { get } from '@shell/utils/object';

const defaultOptions = {
  rel:    'nofollow noopener noreferrer',
  target: '_blank'
};

export default {
  props: {
    row: {
      type:     Object,
      required: true,
    },

    value: {
      type:     [Object, String],
      required: true
    },

    to: {
      type:    Object,
      default: null
    },

    urlKey: {
      type:    String,
      default: null,
    },

    labelKey: {
      type:    String,
      default: null,
    },

    options: {
      type:    [Object, String],
      default: null,
    },

    beforeIcon: {
      type:    String,
      default: null,
    },

    afterIcon: {
      type:    String,
      default: null,
    },

    beforeIconKey: {
      type:    String,
      default: null,
    },

    afterIconKey: {
      type:    String,
      default: null,
    },
  },

  computed: {
    href() {
      if ( this.urlKey ) {
        return get(this.row, this.urlKey);
      }

      if (this.isInternal && (this.to || this.value.to)) {
        const to = this.to || this.value.to;
        const defaultParams = this.$route.params;
        const toParams = to.params || {};

        return {
          ...to,
          params: {
            id: this.value, ...defaultParams, ...toParams
          }
        };
      }

      return this.value?.url;
    },

    rel() {
      if ( this.options && typeof this.options === 'object' ) {
        return this.options.rel;
      } else if ( this.value && typeof this.value === 'object' && this.value.rel !== undefined) {
        return this.value.rel;
      }

      return defaultOptions.rel;
    },

    target() {
      if ( this.options && typeof this.options === 'object' ) {
        return this.options.target;
      } else if ( this.value && typeof this.value === 'object' && this.value.target !== undefined) {
        return this.value.target;
      }

      return defaultOptions.target;
    },

    label() {
      if ( this.labelKey ) {
        return get(this.row, this.labelKey);
      } else if ( typeof this.value === 'string' ) {
        return this.value;
      }

      return this.value?.text || this.href;
    },

    beforeIconClass() {
      if ( this.beforeIconKey ) {
        return get(this.row, this.beforeIconKey);
      }

      return this.beforeIcon;
    },

    afterIconClass() {
      if ( this.afterIconKey ) {
        return get(this.row, this.afterIconKey);
      }

      return this.afterIcon;
    },

    isInternal() {
      return this.options?.internal;
    }
  }
};
</script>

<template>
  <router-link
    v-if="isInternal && href"
    :to="href"
    class="link-text-icon"
  >
    <i
      v-if="beforeIconClass"
      :class="beforeIconClass"
      class="prefix"
    />
    {{ label }}
    <i
      v-if="afterIconClass"
      :class="afterIconClass"
      class="suffix"
    />
  </router-link>
  <a
    v-else-if="href"
    :href="href"
    :rel="rel"
    :target="target"
    class="link-text-icon"
  >
    <i
      v-if="beforeIconClass"
      :class="beforeIconClass"
      class="prefix"
    />
    {{ label }}
    <i
      v-if="afterIconClass"
      :class="afterIconClass"
      class="suffix"
    />
  </a>
  <span v-else> {{ href }} {{ label }}</span>
</template>
<style lang="scss" scoped>
.link-text-icon {
  display: flex;
  align-items: top;

  .prefix {
    margin: 2px 2px 0 0;
  }

  .suffix {
    margin: 2px 0 0 2px;
  }
}
</style>
