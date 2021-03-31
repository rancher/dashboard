<script>
import Type from '@/components/nav/Type';
import $ from 'jquery';

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

    expanded: {
      type:     [Function, Boolean],
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
    }
  },

  data() {
    const id = (this.idPrefix || '') + this.group.name;
    let isExpanded = false;

    if ( !this.canCollapse ) {
      isExpanded = true;
    } else if ( typeof this.expanded === 'function' ) {
      isExpanded = this.expanded(id);
    } else {
      isExpanded = this.expanded === true;
    }

    return { id, isExpanded };
  },

  computed: {
    hasChildren() {
      return this.group.children?.length > 0;
    },

    isOverview() {
      if (this.group.children && this.group.children.length > 0) {
        const grp = this.group.children[0];
        const overviewRoute = grp.route;

        if (overviewRoute && grp.overview) {
          const route = this.$router.resolve(overviewRoute || {});

          return this.$route.fullPath === route.href;
        }
      }

      return false;
    },

    showExpanded() {
      return this.isExpanded || this.isActiveGroup;
    },

    isActiveGroup() {
      if (this.group.children && this.group.children.length > 0) {
        const active = this.group.children.find((item) => {
          if (item.route) {
            const route = this.$router.resolve(item.route);

            return this.$route.fullPath === route.href;
          }

          return false;
        });

        return !!active;
      }

      return false;
    },
  },

  methods: {
    expandCollapse() {
      if (this.canCollapse) {
        this.isExpanded = !this.isExpanded;
        this.$emit('on-toggle', this.id, this.isExpanded);
        this.$store.dispatch('type-map/toggleGroup', {
          group:    this.id,
          expanded: this.isExpanded
        });
      }
    },

    clicked() {
      this.$emit('on-toggle', this.id, true);
    },

    toggle(event, skipAutoClose) {
      const $tgt = $(event.target);

      if ( $tgt.closest('a').length && !$tgt.hasClass('toggle') ) {
        // Ignore clicks on groups that are also types, unless you click the actual toggle icon
        return;
      }

      if ( this.canCollapse ) {
        this.isExpanded = skipAutoClose ? !this.isExpanded : true;
        this.$emit('on-toggle', this.id, this.isExpanded, skipAutoClose);
        this.$store.dispatch('type-map/toggleGroup', {
          group:    this.id,
          expanded: this.isExpanded
        });

        if (this.isExpanded && !skipAutoClose) {
          const items = this.group[this.childrenKey];

          // Navigate to the first item in the group
          const route = items[0].route;

          this.$router.replace(route);
        }
      } else {
        this.$emit('on-toggle', this.id, true);
      }

      if (skipAutoClose) {
        event.stopPropagation();
      }
    }
  }
};
</script>

<template>
  <div class="accordion" :class="{[`depth-${depth}`]: true, 'expanded': showExpanded, 'has-children': hasChildren}">
    <div v-if="showHeader" class="header" :class="{'active': isOverview}" @click="toggle($event)">
      <slot name="header">
        <span v-html="group.labelDisplay || group.label" />
      </slot>
      <i v-if="canCollapse && !isActiveGroup" class="icon toggle" :class="{'icon-chevron-down': !isExpanded, 'icon-chevron-up': isExpanded}" @click="toggle($event, true)" />
    </div>
    <ul v-if="showExpanded" class="list-unstyled body" v-bind="$attrs">
      <template v-for="(child, idx) in group[childrenKey]">
        <li v-if="child.divider" :key="idx">
          <hr />
        </li>
        <li v-else-if="child[childrenKey]" :key="child.name">
          <Group
            :key="id+'_'+child.name+'_children'"
            :id-prefix="id+'_'"
            :depth="depth + 1"
            :children-key="childrenKey"
            :can-collapse="canCollapse"
            :group="child"
            :expanded="expanded"
          />
        </li>
        <Type
          v-else-if="!child.overview"
          :key="id+'_' + child.name + '_type'"
          :is-root="depth == 0 && !showHeader"
          :type="child"
          @click="clicked"
        />
      </template>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
  .header {
    font-size: 14px;
    position: relative;
    cursor: pointer;
    color: var(--input-label);

    > H6 {
      color: var(--body-text);
      user-select: none;
    }

    > A {
      display: block;
    }

    &.active {
      background-color: var(--nav-active);
    }
  }

  .body {
    margin-left: 10px;
  }

  .accordion {
    &.depth-0 {
      > .header {
        padding: 8px 0;

        > H6 {
          font-size: 14px;
          text-transform: none;
          padding-left: 10px;
        }

        > I {
          position: absolute;
          right: 0;
          top: 0;
          padding: 8px;
          user-select: none;

          &:hover {
            background-color: #d0d0d0;
          }
        }
      }

      > .body {
        margin-left: 0;
      }
    }

    &:not(.depth-0) {
      > .header {
        > SPAN {
          // Child groups that aren't linked themselves
          display: inline-block;
          padding: 5px 0 5px 5px;
        }

        > I {
          position: absolute;
          right: 0;
          top: 0;
          padding: 6px 8px 6px 0;
        }
      }
    }
  }

 .body ::v-deep > .child.nuxt-link-active,
 .header ::v-deep > .child.nuxt-link-exact-active {
    background-color: var(--nav-active);
    padding: 0;
    border-left: solid 5px transparent;

    A {
      padding-left: 5px;
    }

    A, A I {
      color: var(--body-text);
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
