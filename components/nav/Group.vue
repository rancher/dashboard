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
      type:     Function,
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
  },

  methods: {
    toggle(event) {
      const $tgt = $(event.target);

      if ( $tgt.closest('a').length && !$tgt.hasClass('toggle') ) {
        // Ignore clicks on groups that are also types, unless you click the actual toggle icon
        return;
      }

      if ( this.canCollapse ) {
        this.isExpanded = !this.isExpanded;
        this.$emit('on-toggle', this.id, this.isExpanded);
        this.$store.dispatch('type-map/toggleGroup', {
          group:    this.id,
          expanded: this.isExpanded
        });
      }
    }
  }
};
</script>

<template>
  <div class="accordion" :class="{[`depth-${depth}`]: true, 'expanded': isExpanded, 'has-children': hasChildren}">
    <div v-if="showHeader" class="header" @click="toggle($event)">
      <slot name="header">
        <span v-html="group.labelDisplay || group.label" />
      </slot>
      <i v-if="canCollapse" class="icon toggle" :class="{'icon-chevron-down': !isExpanded, 'icon-chevron-up': isExpanded}" />
    </div>
    <ul v-if="isExpanded" class="list-unstyled body" v-bind="$attrs">
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
          v-else
          :key="id+'_' + child.name + '_type'"
          :is-root="depth == 0 && !showHeader"
          :type="child"
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
    }

    > A {
      display: block;
    }
  }

  .body {
    margin-left: 10px;
  }

  .accordion {
    &.depth-0 {
      > .header {
        padding: 5px 0;

        > H6 {
          font-size: 14px;
          text-transform: none;
          padding-left: 10px;
        }

        > I {
          position: absolute;
          right: 0;
          top: 0;
          padding: 7px 8px 11px 0;
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
    border-left: solid 5px var(--primary);

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
      transition: ease-in-out all .25s;
    }

    A:focus {
      outline: none;
      box-shadow: 0 0 0 var(--outline-width) var(--outline);
    }
  }
</style>
