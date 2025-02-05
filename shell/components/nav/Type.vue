<script>
import Favorite from '@shell/components/nav/Favorite';
import { TYPE_MODES } from '@shell/store/type-map';

import TabTitle from '@shell/components/TabTitle';

const showFavoritesFor = [TYPE_MODES.FAVORITE, TYPE_MODES.USED];

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
  },

  data() {
    return { near: false };
  },

  computed: {
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

      return this.$store.getters[`${ inStore }/count`]({ name: this.type.name });
    },

    isActive() {
      const typeFullPath = this.$router.resolve(this.type.route)?.fullPath.toLowerCase();
      const pageFullPath = this.$route.fullPath?.toLowerCase();

      if ( !this.type.exact) {
        const typeSplit = typeFullPath.split('/');
        const pageSplit = pageFullPath.split('/');

        for (let index = 0; index < typeSplit.length; ++index) {
          if ( index >= pageSplit.length || typeSplit[index] !== pageSplit[index] ) {
            return false;
          }
        }

        return true;
      }

      return typeFullPath === pageFullPath;
    }

  },

  methods: {
    setNear(val) {
      this.near = val;
    },

    selectType() {
      // Prevent issues if custom NavLink is used #5047
      if (this.type?.route) {
        const typePath = this.$router.resolve(this.type.route)?.fullPath;

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
    v-slot="{ href, navigate,isExactActive }"
    custom
    :to="type.route"
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

        :deep() .icon {
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

    &.nav-type.nav-link {
      a .label {
        display: flex;
      }
    }

    &.nav-type:not(.depth-0) {
      A {
        padding-left: 16px;
      }

      :deep() .label I {
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
