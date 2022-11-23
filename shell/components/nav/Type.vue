<script>
import Favorite from '@shell/components/nav/Favorite';
import { FAVORITE, USED } from '@shell/store/type-map';

const showFavoritesFor = [FAVORITE, USED];

export default {

  components: { Favorite },

  props: {
    type: {
      type:     Object,
      required: true
    },

    isRoot: {
      type:    Boolean,
      default: false,
    },

    depth: {
      type:    Number,
      default: 0,
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
      return ( this.type.mode && this.near && showFavoritesFor.includes(this.type.mode) );
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
    },

    selectType() {
      // Prevent issues if custom NavLink is used #5047
      if (this.type?.route) {
        const typePath = this.$router.resolve(this.type.route)?.route?.fullPath;

        if (typePath !== this.$route.fullPath) {
          this.$emit('selected');
        }
      }
    }
  }
};
</script>

<template>
  <n-link
    v-if="type.route"
    :key="type.name"
    :to="type.route"
    tag="li"
    class="child nav-type"
    :class="{'root': isRoot, [`depth-${depth}`]: true}"
    :exact="type.exact"
  >
    <a
      @click="selectType"
      @mouseenter="setNear(true)"
      @mouseleave="setNear(false)"
    >
      <span
        v-if="type.labelKey"
        class="label"
      ><t :k="type.labelKey" /></span>
      <span
        v-else
        class="label"
        :class="{'no-icon': !type.icon}"
        v-html="type.labelDisplay || type.label"
      />
      <span
        v-if="showFavorite || showCount"
        class="count"
      >
        <Favorite
          v-if="showFavorite"
          :resource="type.name"
        />
        {{ type.count }}
      </span>
    </a>
  </n-link>
  <li
    v-else-if="type.link"
    class="child nav-type"
  >
    <a
      :href="type.link"
      :target="type.target"
      rel="noopener noreferrer nofollow"
      @click="selectType"
      @mouseenter="setNear(true)"
      @mouseleave="setNear(false)"
    >
      <span class="label">{{ type.label }}&nbsp;<i class="icon icon-external-link" /></span>
    </a>
  </li>
  <li v-else>
    {{ type }}?
  </li>
</template>

<style lang="scss" scoped>
  .child {
    margin: 0 var(--outline) 0 0;

    .label {
      align-items: center;
      grid-area: label;
      display: flex;
      overflow: hidden;
      text-overflow: ellipsis;

      &:not(.nav-type) &.no-icon {
        padding-left: 3px;
      }

      ::v-deep .highlight {
        background: var(--diff-ins-bg);
        color: var(--body-text);
        padding: 2px;
      }

      ::v-deep .icon {
        position: relative;
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
      margin: 0 0 0 -3px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--body-text);

      &:hover {
        background: var(--nav-hover);
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
    }

    .count {
      grid-area: count;
      font-size: 12px;
      text-align: right;
      justify-items: center;
      padding-right: 4px;
    }

    &.nav-type:not(.depth-0) {
      A {
        font-size: 13px;
        padding: 5.5px 7px 5.5px 10px;
      }

      ::v-deep .label I {
        padding-right: 2px;
      }
    }
  }

</style>
