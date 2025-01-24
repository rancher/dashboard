<script>
import Type from '@shell/components/nav/Type';
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
          const route = this.$router.resolve(overviewRoute || {});

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
    }
  },

  methods: {
    expandGroup() {
      this.isExpanded = true;
      this.$emit('expand', this.group);
    },

    groupSelected() {
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

        const route = items[index].route;

        if (route) {
          this.$router.replace(route);
        }
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

      for (const item of items.children) {
        if (item.children && this.hasActiveRoute(item)) {
          return true;
        } else if (item.route) {
          const navLevels = ['cluster', 'product', 'resource'];
          const matchesNavLevel = navLevels.filter((param) => !this.$route.params[param] || this.$route.params[param] !== item.route.params[param]).length === 0;
          const withoutHash = this.$route.hash ? this.$route.fullPath.slice(0, this.$route.fullPath.indexOf(this.$route.hash)) : this.$route.fullPath;
          const withoutQuery = withoutHash.split('?')[0];

          if (matchesNavLevel || this.$router.resolve(item.route).fullPath === withoutQuery) {
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
    :class="{[`depth-${depth}`]: true, 'expanded': isExpanded, 'has-children': hasChildren, 'group-highlight': isGroupActive}"
  >
    <div
      v-if="showHeader"
      class="header"
      :class="{'active': isOverview, 'noHover': !canCollapse}"
      role="button"
      tabindex="0"
      :aria-label="group.labelDisplay || group.label || ''"
      @click="groupSelected()"
      @keyup.enter="groupSelected()"
      @keyup.space="groupSelected()"
    >
      <slot name="header">
        <router-link
          v-if="hasOverview"
          :to="group.children[0].route"
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
          <hr>
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
    .header {
      &:focus-visible {
        h6 span {
          @include focus-outline;
          outline-offset: 2px;
        }
      }
      .toggle-accordion:focus-visible {
        @include focus-outline;
        outline-offset: -6px;
      }

      &.active {
        color: var(--primary-hover-text);
        background-color: var(--primary-hover-bg);

        h6 {
          padding: 8px 0 8px 16px;
          font-weight: bold;
          color: var(--primary-hover-text);
        }

        &:hover {
          background-color: var(--primary-hover-bg);
        }
      }
      &:hover:not(.active) {
        background-color: var(--nav-hover);
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

        > I {
          position: absolute;
          right: 0;
          top: 0;
          padding: 10px 10px 9px 7px;
          user-select: none;
        }
      }

      > .body {
        margin-left: 0;
      }

      &.group-highlight {
        background: var(--nav-active);
      }
    }

    &.depth-1 {
      > .header {
        padding-left: 20px;
        > H6 {
          line-height: 18px;
          padding: 8px 0 7px 5px !important;
        }
        > I {
          padding: 10px 7px 9px 7px !important;
        }
      }
    }

    &:not(.depth-0) {
      > .header {
        > H6 {
          // Child groups that aren't linked themselves
          display: inline-block;
          padding: 5px 0 5px 5px;
        }

        > I {
          position: absolute;
          right: 0;
          top: 0;
          padding: 6px 8px 6px 8px;
        }
      }
    }
  }

  .body :deep() > .child.router-link-active,
  .header :deep() > .child.router-link-exact-active {
    padding: 0;

    A, A I {
      color: var(--primary-hover-text);
    }

    A {
      color: var(--primary-hover-text);
      background-color: var(--primary-hover-bg);
      font-weight: bold;
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
