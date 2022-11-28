<script>
import LazyImage from '@shell/components/LazyImage';
import FileSelector from '@shell/components/form/FileSelector';
import { _VIEW } from '@shell/config/query-params';

export default {
  components: { FileSelector, LazyImage },
  props:      {
    value: {
      type:    String,
      default: null,
    },
    /**
     * Edit mode for viewing restrictions
     */
    mode: {
      type:    String,
      default: null,
    },
    /**
     * Displayed label for the upload button
     */
    label: {
      type:    String,
      default: null,
    },
    /**
     * Default already adopted value for size limitation on images in bytes
     */
    byteLimit: {
      type:    Number,
      default: 200000
    },
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    }
  },
  methods: {
    /**
     * Set icon data64
     * @param {string} event
     */
    setIcon(event) {
      this.$emit('input', event);
    }
  }
};
</script>

<template>
  <FileSelector
    v-if="!value && !isView"
    :value="value"
    class="btn role-primary"
    :mode="mode"
    :read-as-data-url="true"
    :byte-limit="byteLimit"
    :label="label"
    @selected="setIcon"
  />

  <div
    v-else
    class="loader"
    :class="{ 'loader--editable': !isView }"
    @click="setIcon()"
  >
    <LazyImage
      :src="value"
      class="loader__image"
    />
    <i class="loader__clear icon icon-trash icon-lg" />
  </div>
</template>

<style lang="scss" scoped>
$logo: 60px;

.loader {
  position: relative;
  width: $logo;
  height: $logo;

  &--editable {
    cursor: pointer;
  }

  &__image {
    width: 100%;
    height: 100%;
    border-radius: calc(2 * var(--border-radius));
    overflow: hidden;
    background-color: white;

    img {
      object-fit: contain;
    }
  }

  &__clear {
    display: none;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
    z-index: 1;
  }

  &--editable:hover &__clear {
    display: inline-block;
  }

  &--editable:hover {
    &:after {
      content: '';
      border-radius: calc(2 * var(--border-radius));
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--overlay-bg);
    }

  }
}
</style>
