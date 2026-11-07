<script>
import Type from '@shell/components/nav/Type';
import { filterLocationValidParams, isNavItemActive } from '@shell/utils/router';
import { isTruncated } from '@shell/utils/style';
import { observeResize } from '@shell/utils/element-resize';
import { RcSeparator } from '@components/RcSeparator';

// The indent scale for the side menu, shared by group headers and type links so that everything at
// the same level of the tree lines up, whichever component renders it. UX owns these numbers: a top
// level row sits 16px in from the edge of the panel, and every level below it steps in 12px more.
const BASE_INDENT = 16;
const INDENT_STEP = 12;

export default {
  name: 'Group',

  components: { Type, RcSeparator },

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
  },

  data() {
    const id = (this.idPrefix || '') + this.group.name;

    return {
      id, labelTruncated: false, stopObserving: null
    };
  },

  computed: {
    /** Indent of this group's own header, in px */
    headerIndent() {
      return BASE_INDENT + (this.depth * INDENT_STEP);
    },

    /** The label as plain text, without the match highlighting `labelDisplay` carries */
    labelText() {
      return this.group.label || '';
    },

    // Only offered once the label has actually been cut off, so the rest of the menu doesn't
    // sprout tooltips repeating what is already on screen. It sits above the row rather than
    // beside it: to the right it would cover the row's own expander.
    labelTooltip() {
      return this.labelTruncated ? { content: this.labelText, placement: 'top' } : undefined;
    },

    // The expander sits over the right hand end of the header row, so the label has to stop short
    // of it rather than running underneath
    showToggle() {
      return !this.onlyHasOverview && this.canCollapse && this.hasChildren;
    },

    /**
     * Indent of this group's children, in px. One level deeper than its own header, unless the
     * header is hidden - a headerless group adds no visible level, so its children stay level
     * with it rather than indenting under a header that was never drawn.
     */
    childIndent() {
      return this.showHeader ? this.headerIndent + INDENT_STEP : this.headerIndent;
    },

    isGroupActive() {
      return this.isOverview || (this.hasActiveRoute() && this.isExpanded && this.showHeader);
    },

    hasChildren() {
      return this.group.children?.length > 0;
    },

    // Finds the overview child regardless of its position in the children array.
    // The new product registration API (PR #17990) pushes the overview last in navNames,
    // so it may not be at index 0 after weight-based reordering.
    overviewChild() {
      return this.group.children?.find((child) => child.overview) || null;
    },

    hasOverview() {
      return !!this.overviewChild;
    },

    onlyHasOverview() {
      return this.group.children && this.group.children.length === 1 && this.hasOverview;
    },

    isOverview() {
      const overviewRoute = this.overviewChild?.route;

      if (!overviewRoute?.name || this.$route.name !== overviewRoute.name) {
        return false;
      }

      // A route name can be shared by several nav items that are told apart only by their params
      // (a legacy product whose pages all use `c-cluster-<product>-page`, for example), so the name
      // on its own isn't enough. `cluster` is the exception: the stored route always carries the
      // BLANK_CLUSTER placeholder rather than the cluster we're actually on (issue #19169).
      const { params = {} } = filterLocationValidParams(this.$router, overviewRoute) || {};

      return Object.entries(params).every(([key, value]) => key === 'cluster' || this.$route.params?.[key] === value);
    },

    // The expand/collapse state lives on the group itself rather than in this
    // component, so it survives the group being unmounted (a nested group only
    // exists while its parent is expanded) and SideNav can read and write the
    // state of the whole tree, including groups that aren't currently rendered.
    isExpanded: {
      get() {
        return this.group.isRoot || !!this.group.expanded;
      },
      set(v) {
        this.group.expanded = v;
      }
    },

    headerRoute() {
      return filterLocationValidParams(this.$router, this.overviewChild.route);
    }
  },

  mounted() {
    this.checkLabelTruncated();

    // A label that fits when it is first laid out can stop fitting later: the web font swaps in
    // over the fallback it was measured with, or the panel is resized. Measuring once on mount
    // leaves those labels cut off with no way to read them.
    //
    // Watching the box is enough on its own, and cheaper than re-measuring on every render: the
    // label is a flex item that is sized to its text while it fits and clamped to the space
    // available once it doesn't, so its width always changes as it crosses between the two.
    if (this.$refs.label) {
      this.stopObserving = observeResize(this.$refs.label, this.checkLabelTruncated);
    }
  },

  beforeUnmount() {
    this.stopObserving?.();
  },

  methods: {
    checkLabelTruncated() {
      this.labelTruncated = isTruncated(this.$refs.label);
    },

    expandGroup() {
      this.isExpanded = true;
      this.$emit('expand', this.group);
    },

    // The group header was clicked, so open the group and navigate into it
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

    // A nav item within the group was clicked. The item routes itself, so there's
    // nothing to navigate here
    selectType() {
      this.close();
    },

    close() {
      this.$emit('close');
    },

    // User clicked on the expander icon, so toggle the expansion so the user can see inside the group
    peek($event) {
      this.isExpanded = !this.isExpanded;
      this.$emit(this.isExpanded ? 'expand' : 'close', this.group);
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

          // Keep the group open wherever the child itself is highlighted, otherwise pages nested under a
          // child's route (its create/detail pages) would collapse the group out from under it
          if (matchesNavLevel || isNavItemActive(this.$router, this.$route, item)) {
            return true;
          }

          if (!parentPath) {
            continue;
          }

          const validItemRoute = filterLocationValidParams(this.$router, item.route);

          // Use .path instead of .fullPath to ignore query parameters and hashes when comparing routes
          const itemPath = this.$router.resolve(validItemRoute).path;

          if (itemPath === parentPath) {
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
    :class="{[`depth-${depth}`]: true, 'expanded': isExpanded, 'has-children': hasChildren, 'has-toggle': showToggle, 'group-highlight': isGroupActive }"
    :style="{ '--nav-indent': `${ headerIndent }px` }"
  >
    <div
      v-if="showHeader || (!onlyHasOverview && canCollapse)"
      class="accordion-item"
    >
      <div
        v-if="showHeader"
        class="header"
        :class="{'active': isOverview, 'noHover': !canCollapse}"
        :role="hasChildren && !hasOverview ? 'button' : undefined"
        :tabindex="hasChildren && !hasOverview ? 0 : undefined"
        :aria-label="hasChildren && !hasOverview ? (group.labelDisplay || group.label || '') : undefined"
        :aria-expanded="hasChildren && !hasOverview ? (!canCollapse || isExpanded) : undefined"
        :aria-controls="hasChildren && !hasOverview ? (!canCollapse ? null : `group-${id}`) : undefined"
        @click="groupSelected()"
        @keyup.enter="groupSelected()"
        @keyup.space="groupSelected()"
      >
        <slot name="header">
          <!-- Group overview with link -->
          <router-link
            v-if="hasOverview && hasChildren"
            :to="headerRoute"
            :exact="overviewChild.exact"
          >
            <h6>
              <span
                ref="label"
                v-clean-html="group.labelDisplay || group.label"
                v-clean-tooltip="labelTooltip"
              />
            </h6>
          </router-link>
          <!-- Non-linked group header -->
          <h6
            v-else-if="hasChildren"
          >
            <span
              ref="label"
              v-clean-html="group.labelDisplay || group.label"
              v-clean-tooltip="labelTooltip"
            />
          </h6>
          <!-- Simple child (nav item) -->
          <ul
            v-else
            class="list-unstyled body root-depth"
            v-bind="$attrs"
          >
            <!-- A childless group is promoted to a plain nav item, so its link sits at the
                 group's own level rather than one level in -->
            <Type

              :key="id+'_' + group.name + '_type'"
              :is-root="depth == 0 && !showHeader"
              :type="group"
              :depth="depth"
              :indent="headerIndent"
              @selected="selectType($event)"
            />
          </ul>
        </slot>
      </div>
      <i
        v-if="showToggle"
        class="icon toggle toggle-accordion"
        :class="{'icon-chevron-right': !isExpanded, 'icon-chevron-down': isExpanded}"
        role="button"
        tabindex="0"
        :aria-label="isExpanded ? t('nav.ariaLabel.collapse', { group: group.labelDisplay || group.label }) : t('nav.ariaLabel.expand', { group: group.labelDisplay || group.label })"
        :aria-expanded="isExpanded"
        :aria-controls="`group-${id}`"
        @click="peek($event, true)"
        @keyup.enter="peek($event, true)"
        @keyup.space="peek($event, true)"
      />
    </div>
    <ul
      v-if="isExpanded"
      :id="`group-${id}`"
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
          <RcSeparator />
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
          :indent="childIndent"
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
      height: 100%;
      // Centred by the flex alignment rather than by vertical padding, so the label sits in the
      // middle of its row at every level instead of needing a hand-picked pair of values per level.
      // 12px on the right is the gutter the whole menu keeps clear of the edge of the panel.
      padding: 0 12px 0 var(--nav-indent, 16px);
      display: flex;
      align-items: center;
      overflow: hidden;

      > SPAN {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
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
      &:focus-visible{
        h6 span {
          @include focus-outline;
        }
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

      // One rule for the expander at every level: centred in its row, and keeping the same 12px
      // clear of the right hand edge that the rest of the menu does
      > I {
        position: absolute;
        right: 0;
        top: 0;
        height: 100%;
        display: flex;
        align-items: center;
        padding: 0 12px;
        user-select: none;
      }

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
        color: var(--on-active);
        background-color: var(--active);

        h6 {
          font-weight: bold;
          color: var(--on-active);
        }

        &:hover {
          background-color: var(--active-hover);
        }

        ~ I {
          color: var(--on-active);
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
    // The expander is drawn over the right hand end of the header row, so a header that has one
    // has to stop its label short of it rather than letting the text run underneath
    &.has-toggle > .accordion-item > .header H6 {
      padding-right: 36px;
    }

    &.depth-0 {
      > .header {

        &.noHover {
          cursor: default;
        }
      }

      > .body {
        margin-left: 0;
      }

      .child:hover {
        background: var(--nav-hover, var(--nav-active));
      }

      &.group-highlight {
        background: var(--rc-section-background-secondary, var(--category-active, var(--nav-active)));

        .active.header {
          &:hover {
            background-color: var(--active-hover)
          }
        }

        .child, .header {
          &:hover {
            background: var(--category-active-hover, var(--primary));
          }
        }
      }

    }

  }

  .body :deep() > .child.router-link-active,
  .accordion-item :deep() > .child.router-link-exact-active {
    padding: 0;

    A, A I {
      color: var(--on-active);
    }

    A {
      color: var(--on-active);
      background-color: var(--active);
      font-weight: bold;

      &:hover {
        background: var(--active-hover);
      }
    }
  }

  .body :deep() > .child {
    A {
      line-height: 16px;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    A:focus {
      outline: none;
    }

    &.root {
      background: transparent;
    }
  }
</style>
