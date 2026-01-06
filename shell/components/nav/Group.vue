<script>
import Type from '@shell/components/nav/Type';
import { filterLocationValidParams } from '@shell/utils/router';
export default {
  name: 'Group',

  components: { Type },

  emits: ['expand', 'close'],

  props: {
    depth: {
      type:    Number,
      default: 0,
    },

    idPrefix: {
      type:     String,
      required: true,
    },

    group: {
      type:     Object,
      required: true,
    },

    childrenKey: {
      type:    String,
      default: 'children',
    },

    canCollapse: {
      type:    Boolean,
      default: true,
    },

    showHeader: {
      type:    Boolean,
      default: true,
    },

    fixedOpen: {
      type:    Boolean,
      default: false,
    },

    highlightRoute: {
      type:    Boolean,
      default: true,
    }
  },

  data() {
    const id = (this.idPrefix || '') + this.group.name;

    return { id, expanded: false };
  },

  computed: {
    isGroupActive() {
      return this.isOverview || (this.hasActiveRoute() && this.isExpanded && this.showHeader);
    },

    hasChildren() {
      return this.group.children?.length > 0;
    },

    hasOverview() {
      return this.group.children?.[0]?.overview;
    },

    onlyHasOverview() {
      return this.group.children && this.group.children.length === 1 && this.hasOverview;
    },

    isOverview() {
      if (this.group.children && this.group.children.length > 0) {
        const grp = this.group.children[0];
        const overviewRoute = grp?.route;

        if (overviewRoute && grp.overview) {
          const validRoute = filterLocationValidParams(this.$router, overviewRoute || {});
          const route = this.$router.resolve(validRoute);

          return this.$route.fullPath.split('#')[0] === route?.fullPath;
        }
      }

      return false;
    },

    isExpanded: {
      get() {
        return this.fixedOpen || this.group.isRoot || !!this.expanded;
      },
      set(v) {
        this.expanded = v;
      }
    },

    headerRoute() {
      return filterLocationValidParams(this.$router, this.group.children[0].route);
    }
  },

  methods: {
    expandGroup() {
      this.isExpanded = true;
      this.$emit('expand', this.group);
    },

    groupSelected() {
      // Can not click on groups that are fixed open
      if (this.fixedOpen) {
        return;
      }

      // Don't auto-select first group entry if we're already expanded and contain the currently-selected nav item
      if (this.hasActiveRoute() && this.isExpanded) {
        return;
      } else {
        // Remove all active class if click on group header and not active route
        const headerEl = document.querySelectorAll('.header');

        headerEl.forEach((el) => {
          el.classList.remove('active');
        });
      }
      this.expandGroup();

      const items = this.group[this.childrenKey];

      // Navigate to one of the child items (by default the first child)
      if (items && items.length > 0) {
        let index = 0;

        // If there is a default type, use it
        if (this.group.defaultType) {
          const found = items.findIndex((i) => i.name === this.group.defaultType);

          index = (found === -1) ? 0 : found;
        }

        const item = items[index];
        const route = item.route;

        if (route) {
          const validRoute = filterLocationValidParams(this.$router, route);

          this.$router.replace(validRoute);
        } else if (item) {
          this.routeToFirstChild(item);
        }
      }
    },

    routeToFirstChild(item) {
      if (item.children.length && item.children[0].route) {
        const validRoute = filterLocationValidParams(this.$router, item.children[0].route);

        this.$router.replace(validRoute);
      }
    },

    selectType() {
      this.groupSelected();
      this.close();
    },

    close() {
      this.$emit('close');
    },

    // User clicked on the expander icon, so toggle the expansion so the user can see inside the group
    peek($event) {
      // Add active class to the current header if click on chevron icon
      $event.target.parentElement.classList.remove('active');
      if (this.hasActiveRoute() && this.isExpanded) {
        $event.target.parentElement.classList.add('active');
      }
      this.isExpanded = !this.isExpanded;
      $event.stopPropagation();
    },

    hasActiveRoute(items) {
      if (!items) {
        items = this.group;
      }

      let parentPath = '';
      const cluster = this.$route.params?.cluster;

      // Where we use nested route configuration, consider the parent route when trying to identify the nav location
      if (this.$route.matched.length > 1) {
        const parentRoute = this.$route.matched[this.$route.matched.length - 2];

        parentPath = parentRoute.path.replace(':cluster', cluster);
        parentPath = parentPath === '/' ? undefined : parentPath;
      }

      for (const item of items.children) {
        if (item.children && this.hasActiveRoute(item)) {
          return true;
        } else if (item.route) {
          const navLevels = ['cluster', 'product', 'resource'];
          const matchesNavLevel = navLevels.filter((param) => !this.$route.params[param] || this.$route.params[param] !== item.route.params[param]).length === 0;
          const withoutHash = this.$route.hash ? this.$route.fullPath.slice(0, this.$route.fullPath.indexOf(this.$route.hash)) : this.$route.fullPath;
          const withoutQuery = withoutHash.split('?')[0];
          const validItemRoute = filterLocationValidParams(this.$router, item.route);
          const itemFullPath = this.$router.resolve(validItemRoute).fullPath;

          if (matchesNavLevel || itemFullPath === withoutQuery) {
            return true;
          } else if (parentPath && itemFullPath === parentPath) {
            return true;
          }
        }
      }

      return false;
    },

    syncNav() {
      const refs = this.$refs.groups;

      if (refs) {
        // Only expand one group - so after the first has been expanded, no more will
        let canExpand = true;

        refs.forEach((grp) => {
          if (!grp.group.isRoot) {
            if (canExpand) {
              const isActive = this.hasActiveRoute(grp.group);

              if (isActive) {
                grp.isExpanded = true;
                canExpand = false;
                this.$nextTick(() => grp.syncNav());
              }
            }
          }
        });
      }
    }
  }
};
</script>

<template>
  <div
    class="accordion"
    :class="{[`depth-${depth}`]: true, 'expanded': isExpanded, 'has-children': hasChildren, 'group-highlight': highlightRoute && isGroupActive }"
  >
    <div
      v-if="showHeader || (!onlyHasOverview && canCollapse)"
      class="accordion-item"
    >
      <div
        v-if="showHeader"
        class="header"
        :class="{'active': highlightRoute && isOverview, 'noHover': !canCollapse || fixedOpen}"
        role="button"
        :tabindex="fixedOpen ? -1 : 0"
        :aria-label="group.labelDisplay || group.label || ''"
        @click="groupSelected()"
        @keyup.enter="groupSelected()"
        @keyup.space="groupSelected()"
      >
        <slot name="header">
          <router-link
            v-if="hasOverview"
            :to="headerRoute"
            :exact="group.children[0].exact"
            :tabindex="-1"
          >
            <h6>
              <span v-clean-html="group.labelDisplay || group.label" />
            </h6>
          </router-link>
          <h6
            v-else
          >
            <span v-clean-html="group.labelDisplay || group.label" />
          </h6>
        </slot>
      </div>
      <i
        v-if="!onlyHasOverview && canCollapse"
        class="icon toggle toggle-accordion"
        :class="{'icon-chevron-right': !isExpanded, 'icon-chevron-down': isExpanded}"
        role="button"
        tabindex="0"
        :aria-label="t('nav.ariaLabel.collapseExpand')"
        @click="peek($event, true)"
        @keyup.enter="peek($event, true)"
        @keyup.space="peek($event, true)"
      />
    </div>
    <ul
      v-if="isExpanded"
      class="list-unstyled body"
      v-bind="$attrs"
    >
      <template
        v-for="(child, idx) in group[childrenKey]"
        :key="idx"
      >
        <li
          v-if="child.divider"
          :key="idx"
        >
          <hr role="none">
        </li>
        <!-- <div v-else-if="child[childrenKey] && hideGroup(child[childrenKey])" :key="child.name">
          HIDDEN
        </div> -->
        <li
          v-else-if="child[childrenKey]"
          :key="child.name"
        >
          <Group
            ref="groups"
            :key="id+'_'+child.name+'_children'"
            :id-prefix="id+'_'"
            :depth="depth + 1"
            :children-key="childrenKey"
            :can-collapse="canCollapse"
            :group="child"
            :fixed-open="fixedOpen"
            :highlight-route="highlightRoute"
            @selected="groupSelected($event)"
            @expand="expandGroup($event)"
            @close="close($event)"
          />
        </li>
        <Type
          v-else-if="!child.overview || group.name === 'starred'"
          :key="id+'_' + child.name + '_type'"
          :is-root="depth == 0 && !showHeader"
          :type="child"
          :depth="depth"
          :highlight-route="highlightRoute"
          @selected="selectType($event)"
        />
      </template>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
  .header {
    position: relative;
    cursor: pointer;
    color: var(--body-text);
    height: 33px;
    outline: none;

    H6 {
      color: var(--body-text);
      user-select: none;
      text-transform: none;
      font-size: 14px;
    }

    > H6 {
        text-transform: none;
        height: 100%;
        padding: 8px 0 8px 16px;
      }

    > A {
      display: block;
      box-sizing:border-box;
      height: 100%;
      &:hover{
        text-decoration: none;
      }
      &:focus{
        outline:none;
      }
      > H6 {
        text-transform: none;
        padding: 8px 0 8px 16px;
      }
    }
  }

  .accordion {
    .accordion-item {
      position: relative;
      cursor: pointer;
      color: var(--body-text);
      height: 33px;
      outline: none;

      .toggle-accordion:focus-visible {
        @include focus-outline;
        outline-offset: -6px;
      }
    }

    .header {
      &:focus-visible {
        h6 span {
          @include focus-outline;
          outline-offset: 2px;
        }
      }

      &.active {
        color: var(--on-active, var(--primary-hover-text));
        background-color: var(--active-nav, var(--primary-hover-bg));

        h6 {
          padding: 8px 0 8px 16px;
          font-weight: bold;
          color: var(--on-active, var(--primary-hover-text));
        }

        &:hover {
          background-color: var(--nav-active-hover, var(--primary-hover-bg));
        }

        ~ I {
          color: var(--on-active, var(--primary-hover-text));
        }
      }
      &:hover:not(.active) {
        background-color: var(--nav-hover);
      }
      &:hover:not(.active).noHover {
        background-color: inherit;
      }
    }
  }

  .accordion {
    &.depth-0 {
      > .header {

        &.noHover {
          cursor: default;
        }

        > H6 {
          text-transform: none;
          padding: 8px 0 8px 16px;
        }
      }

      .accordion-item > I {
        position: absolute;
        right: 0;
        top: 0;
        padding: 10px 10px 9px 7px;
        user-select: none;
      }

      > .body {
        margin-left: 0;
      }

      .child:hover {
        background: var(--nav-hover, var(--nav-active));
      }

      &.group-highlight {
        background: var(--category-active, var(--nav-active));

        .active.header {
          &:hover {
            background-color: var(--nav-active-hover)
          }
        }

        .child, .header {
          &:hover {
            background: var(--category-active-hover, var(--primary));
          }
        }
      }
    }

    &.depth-1 {
      > .accordion-item > .header {
        padding-left: 20px;
        > H6 {
          line-height: 18px;
          padding: 8px 0 7px 5px !important;
        }

      }

      .accordion-item > I {
        padding: 10px 7px 9px 7px !important;
      }

      &:deep() .type-link > .label {
        padding-left: 10px;
      }
    }

    &:not(.depth-0) {
      > .accordion-item > .header {
        > H6 {
          // Child groups that aren't linked themselves
          display: inline-block;
          padding: 5px 0 5px 5px;
        }
      }

      .accordion-item > I {
        position: absolute;
        right: 0;
        top: 0;
        padding: 6px 8px 6px 8px;
      }
    }
  }

  .body :deep() > .child.router-link-active,
  .accordion-item :deep() > .child.router-link-exact-active {
    padding: 0;

    A, A I {
      color: var(--on-active, var(--primary-hover-text));
    }

    A {
      color: var(--on-active, var(--primary-hover-text));
      background-color: var(--active-nav, var(--primary-hover-bg));
      font-weight: bold;

      &:hover {
        background: var(--nav-active-hover);
      }
    }
  }

  .body :deep() > .child {
    A {
      border-left: solid 5px transparent;
      line-height: 16px;
      font-size: 14px;
      padding-left: 24px;
      display: flex;
      justify-content: space-between;
    }

    A:focus {
      outline: none;
    }

    &.root {
      background: transparent;
      A {
        padding-left: 14px;
      }
    }
  }
</style>
