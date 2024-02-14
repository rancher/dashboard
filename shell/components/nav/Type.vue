<script>
import Favorite from '@shell/components/nav/Favorite';
import { TYPE_MODES } from '@shell/store/type-map';

const showFavoritesFor = [TYPE_MODES.FAVORITE, TYPE_MODES.USED];

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
      near:     false,
      over:     false,
      menuPath: this.type.route ? this.$router.resolve(this.type.route)?.route?.path : undefined,
    };
  },

  computed: {
    isCurrent() {
      // This is required to avoid scenarios where fragments break vue routers location matching
      // For example, the following fails
      // Curruent Path /c/c-m-hzqf4tqt/explorer/members#project-membership
      // Menu Path /c/c-m-hzqf4tqt/explorer/members
      // vue-router exact-path="true" fixes this (https://v3.router.vuejs.org/api/#exact-path),
      // but fails when the the current path is a child (for instance a resource detail page)

      // Scenarios to consider
      // - Fragement world
      //   Curruent Path /c/c-m-hzqf4tqt/explorer/members#project-membership
      //   Menu Path /c/c-m-hzqf4tqt/explorer/members
      // - Similar current paths
      //   /c/c-m-hzqf4tqt/fleet/fleet.cattle.io.bundlenamespacemapping
      //   /c/c-m-hzqf4tqt/fleet/fleet.cattle.io.bundle
      // - Other menu items that appear in current menu item
      //   /c/c-m-hzqf4tqt/fleet
      //   /c/c-m-hzqf4tqt/fleet/management.cattle.io.fleetworkspace

      // If there's no hash the n-link will determine it's linkActiveClass correctly, so avoid this faff
      const invalidHash = !this.$route.hash;
      // Lets be super safe
      const invalidProps = !this.menuPath || !this.$route.path;

      if (invalidHash || invalidProps) {
        return false;
      }

      // We're kind of, but in a fixing way, copying n-link --> vue-router link see vue-router/src/components/link.js & vue-router/src/util/route.js
      // We're only going to compare the path and ignore query and fragment

      if (this.type.exact) {
        return this.$route.path === this.menuPath;
      }

      const currentPath = this.$route.path.split('/');
      const menuPath = this.menuPath.split('/');

      if (menuPath.length > currentPath.length) {
        return false;
      }

      for (let i = 0; i < menuPath.length; i++) {
        if (menuPath[i] !== currentPath[i]) {
          return false;
        }
      }

      return true;
    },

    showFavorite() {
      return ( this.type.mode && this.near && showFavoritesFor.includes(this.type.mode) );
    },

    showCount() {
      return this.count !== undefined;
    },

    namespaceIcon() {
      return this.type.namespaced;
    },

    count() {
      if (this.type.count !== undefined) {
        return this.type.count;
      }

      const inStore = this.$store.getters['currentStore'](this.type.name);

      return this.$store.getters[`${ inStore }/count`]({ name: this.type.name });
    }

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
    :class="{'root': isRoot, [`depth-${depth}`]: true, 'router-link-active': isCurrent}"
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
        v-clean-html="type.labelDisplay || type.label"
        class="label"
        :class="{'no-icon': !type.icon}"
      />
      <span
        v-if="showFavorite || showCount"
        class="count"
      >
        <Favorite
          v-if="showFavorite"
          :resource="type.name"
        />
        <i
          v-if="namespaceIcon"
          class="icon icon-namespace namespaced"
        />
        {{ count }}
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
  .namespaced {
    margin-right: 4px;
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
      height: 33px;

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

    &.nav-type:not(.depth-0) {
      A {
        padding-left: 16px;
      }

      ::v-deep .label I {
        padding-right: 2px;
      }
    }

    &.nav-type:is(.depth-1) {
      A {
        font-size: 13px;
        padding-left: 23px;
      }
    }

    &.nav-type:not(.depth-0):not(.depth-1) {
      A {
        padding-left: 14px;
      }
    }
  }

</style>
