<script>
// Added by Verrazzano
import Indicator from './Indicator';
import NavigationNode from './NavigationNode';
import NavigationHelper from '../../mixins/navigation-helper';

export default {
  name: 'NavigationNode',

  components: {
    Indicator,
    NavigationNode
  },

  mixins: [NavigationHelper],

  props: {
    navNode: {
      type:    Object,
      default: () => ({})
    },

    navigator: {
      type:    Object,
      default: () => ({})
    },

    activeTabName: {
      type:    String,
      default: undefined
    },
  },

  methods: {
    isActive(navNode) {
      return this.activeTabName === navNode.name;
    },

    select(navNode, event) {
      if (this.isActive(navNode) || (!this.isActive(navNode) && !navNode.showChildren)) {
        this.toggleChildren(navNode);
      }

      this.navigator.select(navNode.name, event);
    },

    selectNext(direction) {
      /* not sure how to navigate */
    },

    toggleChildren(navNode) {
      this.$set(navNode, 'showChildren', !navNode.showChildren);
    },
  },

  computed: {
    hasChildren() {
      return this.navNode.children && this.navNode.children.length;
    }
  },
};
</script>

<template>
  <div class="tab-set">
    <div
      v-if="navNode.label"
      :class="{'tab-row': true, active: isActive(navNode), disabled: false}"
    >
      <a
        role="tab"
        :class="{active: isActive(navNode), disabled: false}"
        @click.prevent="select(navNode, $event)"
      >
        <div>
          {{ navNode.label }}
        </div>
        <div
          v-if="hasChildren"
          :class="{'fold-button': true, open: navNode.showChildren}"
          @click.stop.prevent="toggleChildren(navNode, $event)"
        >
          <Indicator></Indicator>
        </div>
      </a>
    </div>
    <ul
      v-if="navNode.showChildren"
      ref="tablist"
      role="tablist"
      class="tabs"
      tabindex="0"
      @keydown.right.prevent="selectNext(1)"
      @keydown.left.prevent="selectNext(-1)"
      @keydown.down.prevent="selectNext(1)"
      @keydown.up.prevent="selectNext(-1)"
    >
      <li
        v-for="navChild in navNode.children"
        :key="navChild._id"
        :class="{tab: true}"
        role="presentation"
      >
        <NavigationNode
          :nav-node="navChild"
          :navigator="navigator"
          :active-tab-name="activeTabName"
        >
        </NavigationNode>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>

  .tree-tabbed {
    & .tab-nav {
      > .tab-set {
        width: fit-content;
        min-width: 100%;

        > .tabs {
          margin-left: 0;
        }
      }
    }

    & .tabs {
      list-style-type: none;
      margin: 0 0 0 1.5em;
      padding: 0;
      display: flex;
      flex: 1 0;
      flex-direction: column;
      user-select: none;

      &:focus {
        outline:none;

        & .tab.active {
          text-decoration: underline;
        }
      }

      & .tab {
        width: 100%;
        position: relative;
        float: left;
        cursor: pointer;

        .tab-row {
          display: block;
          align-items: center;
          border-left: solid 5px transparent;
        }

        .tab-row.active {
          background-color: var(--body-bg);
          border-left: solid 5px var(--primary);
        }

        .fold-button {
          display: flex;
          width: 10px;
          margin: 0 0 0 10px;
          flex: 0 0 auto;
          align-items: center;
        }

        .fold-button svg {
          display: block;
          fill: var(--input-label);
          height: 10px;
        }

        .fold-button.open svg {
          transform: rotate(180deg)
        }

        A {
          display: flex;
          padding: 10px 15px 10px 15px;
          color: var(--primary);
          white-space: nowrap;
        }

        & A.active {
          color: var(--input-label);
        }

        & A.disabled {
          background-color: var(--disabled-bg);
          color: var(--disabled-text);
          text-decoration: none;
        }

        &.toggle A {
          color: var(--primary);
        }
      }
    }
  }
</style>
