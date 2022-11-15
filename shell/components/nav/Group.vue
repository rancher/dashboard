<script>
import Type from '@shell/components/nav/Type';
export default {
  name: 'Group',

  components: { Type },

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

          return this.$route.fullPath === route?.route?.fullPath;
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
      }

      this.expandGroup();

      const items = this.group[this.childrenKey];

      // Navigate to one of the child items (by default the first child)
      if (items && items.length > 0) {
        let index = 0;

        // If there is a default type, use it
        if (this.group.defaultType) {
          const found = items.findIndex(i => i.name === this.group.defaultType);

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
          const matchesNavLevel = navLevels.filter(param => !this.$route.params[param] || this.$route.params[param] !== item.route.params[param]).length === 0;
          const withoutHash = this.$route.hash ? this.$route.fullPath.slice(0, this.$route.fullPath.indexOf(this.$route.hash)) : this.$route.fullPath;
          const withoutQuery = withoutHash.split('?')[0];

          if (matchesNavLevel || this.$router.resolve(item.route).route.fullPath === withoutQuery) {
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
    :class="{[`depth-${depth}`]: true, 'expanded': isExpanded, 'has-children': hasChildren}"
  >
    <div
      v-if="showHeader"
      class="header"
      :class="{'active': isOverview, 'noHover': !canCollapse}"
      @click="groupSelected()"
    >
      <slot name="header">
        <n-link
          v-if="hasOverview"
          :to="group.children[0].route"
          :exact="group.children[0].exact"
        >
          <h6 v-html="group.labelDisplay || group.label" />
        </n-link>
        <h6
          v-else
          v-html="group.labelDisplay || group.label"
        />
      </slot>
      <i
        v-if="!onlyHasOverview && canCollapse"
        class="icon toggle"
        :class="{'icon-chevron-down': !isExpanded, 'icon-chevron-up': isExpanded}"
        @click="peek($event, true)"
      />
    </div>
    <ul
      v-if="isExpanded"
      class="list-unstyled body"
      v-bind="$attrs"
    >
      <template v-for="(child, idx) in group[childrenKey]">
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

    > H6 {
      color: var(--body-text);
      user-select: none;
      text-transform: none;
      font-size: 14px;
    }

    > A {
      display: block;
      padding-left: 10px;
      &:hover{
          text-decoration: none;
        }
      &:focus{
        outline:none;
      }
      > H6 {
        font-size: 14px;
        text-transform: none;
      }
    }

    &.active {
      background-color: var(--nav-active);
    }
  }

  .body {
    margin-left: 10px;
  }

  .accordion {
    .header {
      &:hover:not(.noHover) {
        background-color: var(--nav-hover);
      }

      > I {
        &:hover {
          background-color: var(--nav-expander-hover);
        }
      }
    }
  }

  .accordion {
    &.depth-0 {
      > .header {
        padding: 8px 0;

        &.noHover {
          cursor: default;
        }

        > H6 {
          font-size: 14px;
          text-transform: none;
          padding-left: 10px;
        }

        > I {
          position: absolute;
          right: 0;
          top: 0;
          padding: 10px 7px 9px 7px;
          user-select: none;
        }
      }

      > .body {
        margin-left: 0;
      }
    }

    &.depth-1 {
      > .header {
        > H6 {
          font-size: 13px;
          line-height: 16px;
          padding: 8px 0 7px 5px !important;
        }
        > I {
          padding: 9px 7px 8px 7px !important;
        }
      }
    }

    &:not(.depth-0) {
      > .header {
        padding-left: 10px;
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

 .body ::v-deep > .child.nuxt-link-active,
 .header ::v-deep > .child.nuxt-link-exact-active {
    padding: 0;

    A, A I {
      color: var(--body-text);
    }

    A {
      background-color: var(--nav-active);
    }
  }

  .body ::v-deep > .child {
    A {
      border-left: solid 5px transparent;
      line-height: 16px;
      font-size: 13px;
    }

    A:focus {
      outline: none;
    }
  }
</style>
