<script>
import Favorite from '@/components/nav/Favorite';

export default {

  components: { Favorite },
  props:      {
    type: {
      type:     Object,
      required: true
    },
  },

  data() {
    return {
      near: false,
      over: false,
    };
  },

  computed: {
    showFavorite() {
      return (this.type.mode === 'favorite' || this.type.mode === 'recent') && this.near;
    },

    showCount() {
      return typeof this.type.count !== 'undefined';
    },
  },

  methods: {
    setNear(val) {
      this.near = val;
    },

    setOver(val) {
      this.over = val;
    },

    removeFavorite() {
      this.$store.dispatch('type-map/removeFavorite', this.type.name);
    }
  }
};
</script>

<template>
  <n-link
    :key="type.name"
    :to="type.route"
    tag="li"
    class="child"
  >
    <a
      @mouseenter="setNear(true)"
      @mouseleave="setNear(false)"
    >
      <span class="label" v-html="type.labelDisplay || type.label" />
      <span v-if="showFavorite || showCount" class="count">
        <Favorite v-if="showFavorite" :resource="type.name" />
        {{ type.count }}
      </span>
    </a>
  </n-link>
</template>

<style lang="scss" scoped>
  .child {
    A {
      display: grid;
      grid-template-areas: "label count";
      grid-template-columns: auto auto;
      grid-column-gap: 5px;
      font-size: 12px;
      padding: 7px 5px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .label {
      grid-area: label;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;

      ::v-deep .highlight {
        background: var(--diff-ins-bg);
        color: white;
        padding: 2px;
      }

      ::v-deep .icon {
        position: relative;
        top: -1px;
        color: var(--muted);
      }
    }

    .favorite {
      grid-area: favorite;
      font-size: 12px;
      position: relative;
      top: -1px;
    }

    .count {
      grid-area: count;
      font-size: 12px;
      text-align: right;
      justify-items: center;
    }
  }
</style>
