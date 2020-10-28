<script>
import Favorite from '@/components/nav/Favorite';
import { FAVORITE, USED } from '@/store/type-map';

const showFavoritesFor = [FAVORITE, USED];

export default {

  components: { Favorite },
  props:      {
    type: {
      type:     Object,
      required: true
    },

    isRoot: {
      type:    Boolean,
      default: false,
    }
  },

  data() {
    return {
      near: false,
      over: false,
    };
  },

  computed: {
    showFavorite() {
      return ( showFavoritesFor.includes(this.type.mode) && this.near );
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
    :class="{'root': isRoot}"
    :exact="type.exact"
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
    margin: 0 var(--outline) 0 0;

    .label {
      grid-area: label;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;

      ::v-deep .highlight {
        background: var(--diff-ins-bg);
        color: var(--body-text);
        padding: 2px;
      }

      ::v-deep .icon {
        position: relative;
        top: -1px;
        color: var(--muted);
      }
    }

    A {
      display: grid;
      grid-template-areas: "label count";
      grid-template-columns: auto auto;
      grid-column-gap: 5px;
      font-size: 14px;
      line-height: 24px;
      padding: 7.5px 7px 7.5px 10px;
      margin: 0 2px 0 -3px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &:hover {
        background: var(--dropdown-hover-bg);
        text-decoration: none;

        ::v-deep .icon {
          color: var(--body-text);
        }
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
      line-height: 20px;
    }
  }
</style>
