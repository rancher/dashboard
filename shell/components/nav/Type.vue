<script>
import Favorite from '@shell/components/nav/Favorite';
import { TYPE_MODES } from '@shell/store/type-map';

import TabTitle from '@shell/components/TabTitle';
import { filterLocationValidParams, isNavItemActive } from '@shell/utils/router';

const showFavoritesFor = [TYPE_MODES.FAVORITE, TYPE_MODES.USED];

// Where a link's text sits relative to its own padding box: Group draws a 5px transparent left
// border on every nav link (`.body > .child A`) and the link pulls itself 3px left with a negative
// margin. Both are subtracted from `indent` so the text, rather than the box, lines up with the
// group headers at the same level.
const LINK_TEXT_OFFSET = 5 - 3;

export default {

  components: { Favorite, TabTitle },

  emits: ['selected'],

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

    /**
     * Left indent of this link in px, on the same scale Group indents its headers with, so a link
     * lines up with the group headers that sit at the same level of the tree. Set by Group, which
     * is the only thing that knows how deep this link sits.
     */
    indent: {
      type:    Number,
      default: null,
    },
  },

  data() {
    return { near: false };
  },

  computed: {
    indentStyle() {
      return this.indent === null ? null : { paddingLeft: `${ this.indent - LINK_TEXT_OFFSET }px` };
    },

    showFavorite() {
      return ( this.type.mode && this.near && showFavoritesFor.includes(this.type.mode) );
    },

    showCount() {
      return this.count !== undefined && this.count !== null;
    },

    namespaceIcon() {
      return this.type.namespaced;
    },

    count() {
      if (this.type.count !== undefined) {
        return this.type.count;
      }

      const inStore = this.$store.getters['currentStore'](this.type.name);
      const typeOptions = this.$store.getters[`type-map/optionsFor`](this.type.name);

      if (typeOptions?.custom?.countGetter && typeof typeOptions.custom?.countGetter === 'function') {
        return typeOptions.custom.countGetter(this.$store.getters);
      }

      return this.$store.getters[`${ inStore }/count`]({ name: this.type.name });
    },

    isActive() {
      return isNavItemActive(this.$router, this.$route, this.type);
    },

    typeRoute() {
      return filterLocationValidParams(this.$router, this.type.route);
    }

  },

  methods: {
    setNear(val) {
      this.near = val;
    },

    selectType() {
      // Prevent issues if custom NavLink is used #5047
      if (this.type?.route) {
        const validRoute = filterLocationValidParams(this.$router, this.type.route);
        const typePath = this.$router.resolve(validRoute)?.fullPath;

        if (typePath !== this.$route.fullPath) {
          this.$emit('selected');
        }
      }
    }
  }
};
</script>

<template>
  <router-link
    v-if="type.route"
    :key="type.name"
    v-slot="{ href, navigate, isExactActive }"
    custom
    :to="typeRoute"
  >
    <li
      class="child nav-type"
      :class="{'root': isRoot, [`depth-${depth}`]: true, 'router-link-active': isActive, 'router-link-exact-active': isExactActive}"
      @click="navigate"
      @keypress.enter="navigate"
    >
      <TabTitle
        v-if="isExactActive"
        :show-child="false"
      >
        {{ type.labelKey ? t(type.labelKey) : (type.labelDisplay || type.label) }}
      </TabTitle>
      <a
        role="link"
        :aria-label="type.labelKey ? t(type.labelKey) : (type.labelDisplay || type.label)"
        :href="href"
        class="type-link"
        :style="indentStyle"
        :aria-current="isActive ? 'page' : undefined"
        @click="selectType(); navigate($event);"
        @mouseenter="setNear(true)"
        @mouseleave="setNear(false)"
      >
        <span
          v-if="type.labelKey"
          class="label"
        ><t :k="type.labelKey" /></span>
        <span
          v-else
          v-clean-html="type.labelDisplay || type.label"
          class="label"
          :class="{'no-icon': !type.icon}"
        />
        <span
          v-if="showFavorite || namespaceIcon || showCount"
          class="count"
        >
          <Favorite
            v-if="showFavorite"
            :resource="type.name"
          />
          <i
            v-if="namespaceIcon"
            class="icon icon-namespace"
            :class="{'ns-and-icon': showCount}"
            data-testid="type-namespaced"
          />
          <span
            v-if="showCount"
            data-testid="type-count"
          >{{ count }}</span>
        </span>
      </a>
    </li>
  </router-link>
  <li
    v-else-if="type.link"
    class="child nav-type nav-link"
    data-testid="link-type"
  >
    <a
      role="link"
      :style="indentStyle"
      :href="type.link"
      :target="type.target"
      rel="noopener noreferrer nofollow"
      :aria-label="type.label"
    >
      <span class="label">{{ type.label }}&nbsp;<i class="icon icon-external-link" /></span>
    </a>
  </li>
  <li v-else>
    {{ type }}?
  </li>
</template>

<style lang="scss" scoped>
  .ns-and-icon {
    margin-right: 4px;
  }

  .type-link:focus-visible span.label {
    @include focus-outline;
    outline-offset: 2px;
  }

  .nav-link a:focus-visible .label {
    @include focus-outline;
    outline-offset: 2px;
  }

  .child {
    margin: 0 var(--outline) 0 0;

    .label {
      align-items: center;
      grid-area: label;
      overflow: hidden;
      text-overflow: ellipsis;

      &:not(.nav-type) &.no-icon {
        padding-left: 3px;
      }

      :deep() .highlight {
        background: var(--diff-ins-bg);
        color: var(--body-text);
        padding: 2px;
      }

      :deep() .icon {
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
      // The left padding is a fallback only - Group sets it inline via the `indent` prop, which
      // is what actually lines a link up with the group headers at the same level of the tree
      padding: 7.5px 7px 7.5px 10px;
      margin: 0 0 0 -3px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--body-text);
      height: 33px;

      &:hover {
        text-decoration: none;
      }
    }

    .favorite {
      grid-area: favorite;
      font-size: 12px;
      position: relative;
      vertical-align: middle;
      margin-right: 4px;
    }

    .count {
      font-size: 12px;
      justify-items: center;
      padding-right: 4px;
      display: flex;
      align-items: center;
    }

    &.nav-type.nav-link {
      a .label {
        display: flex;
      }
    }

    // A link's `depth` is the depth of the group holding it, so a depth 0 link is a level 2 entry.
    // Anything below that - a link inside a nested group, so level 3 and deeper - steps down a
    // size. Group headers stay at 14px at every level, so a group reads as a heading next to the
    // links beneath it.
    &.nav-type:not(.depth-0) {
      :deep() .label I {
        padding-right: 2px;
      }

      A {
        font-size: 13px;
      }
    }
  }

</style>
