<script>
export default {
  props: {
    cluster: {
      type:     Object,
      required: true,
    },
  },
  computed: {
    isEnabled() {
      return !!this.cluster?.ready;
    },
  },
  methods: {
    /**
     * Shortens an input string based on the number of segments it contains.
     * @param {string} input - The input string to be shortened.
     * @returns {string} - The shortened string.
     * @example smallIdentifier('local') => 'lcl'
     * @example smallIdentifier('word-wide-web') => 'www'
     */
    smallIdentifier(input) {
      if (this.cluster.badge?.iconText) {
        return this.cluster.badge?.iconText;
      }

      if (!input) {
        return '';
      }

      if (input.length <= 3) {
        return input;
      }

      const segments = input.match(/([A-Za-z]+|\d+)/g);

      if (!segments) return ''; // In case no valid segments are found

      let result = '';

      switch (segments.length) {
      case 1:
        // eslint-disable-next-line no-case-declarations
        const word = segments[0];

        result = `${ word[0] }${ word[Math.floor(word.length / 2)] }${ word[word.length - 1] }`;
        break;
      case 2:
        result = `${ segments[0][0] }${ segments[1][0] }${ segments[1][segments[1].length - 1] }`;
        break;
      default:
        result = segments.slice(0, 3).map((segment) => segment[0]).join('');
      }

      return result;
    },

  }
};
</script>

<template>
  <div
    v-if="cluster"
    class="cluster-icon-menu"
  >
    <div
      class="cluster-badge-logo"
      :class="{ 'disabled': !isEnabled }"
      :style="{borderBottom: cluster.badge?.color ? `4px solid ${cluster.badge?.color}` : ''}"
    >
      <span
        class="cluster-badge-logo-text"
      >
        {{ smallIdentifier(cluster.label) }}
      </span>
      <!-- {{ cluster.badge.iconText }} -->
    </div>
    <i
      v-if="cluster.pinned"
      class="icon icon-pin cluster-pin-icon"
    />
  </div>
</template>

<style lang="scss" scoped>

  .cluster-icon-menu {
    position: relative;
    align-items: center;
    display: flex;
    height: 28px;
    justify-content: center;
    width: 42px;
  }
  .cluster-pin-icon {
    position: absolute;
    top: -6px;
    right: -4px;
    font-size: 12px;
    transform: scaleX(-1);
  }

  .cluster-badge-logo {
    width: 42px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--default-active-text);
    font-weight: bold;
    background: var(--nav-icon-badge-bg);
    border: 1px solid var(--default-border);
    border-radius: 5px;
    padding-top: 2px;
    font-size: 12px;
    text-transform: uppercase;

    &.disabled {
      filter: grayscale(1);
      color: var(--muted);
    }
  }
</style>
