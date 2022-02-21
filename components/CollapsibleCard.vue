<script>
export default {
  name:       'CollapsibleCard',
  props:      {
    isCollapsed: {
      type:    Boolean,
      default: false
    },
    title: {
      type:    String,
      default: ''
    },
    isTitleClickable: {
      type:    Boolean,
      default: false
    }
  },
  methods: {
    toggleCollapse() {
      this.$emit('toggleCollapse', !this.isCollapsed);
    },
    titleClick(ev) {
      if (this.isTitleClickable) {
        ev.stopPropagation();
        this.$emit('titleClick');
      }
    }
  },
};
</script>

<template>
  <div class="collapsible-card" :class="{isCollapsed: isCollapsed}">
    <div class="collapsible-card-header" @click="toggleCollapse">
      <h2 class="mb-0">
        <span
          :class="{isTitleClickable: isTitleClickable}"
          @click="titleClick"
        >{{ title }}</span>
      </h2>
      <div>
        <slot name="header-right"></slot>
        <i
          class="collapsible-card-collapse-icon"
          :class="{
            'icon-chevron-up': !isCollapsed,
            'icon-chevron-down': isCollapsed
          }"
        />
      </div>
    </div>
    <div class="collapsible-card-body">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.collapsible-card {
  min-width: 570px;
  border-radius: 5px;
  border: 1px solid var(--sortable-table-top-divider);

  &.isCollapsed {
    .collapsible-card-header {
      border-bottom: none;
    }
    .collapsible-card-body {
      visibility: hidden;
      display: none;
    }
  }

  &-header {
    background-color: var(--sortable-table-header-bg);
    border-bottom: 1px solid var(--sortable-table-top-divider);
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;

    h2 {
      display: flex;
      align-items: center;

      span.isTitleClickable:hover {
        text-decoration: underline;
      }
    }

    > div {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  &-collapse-icon {
    font-size: 24px;
    color: #B7B8BB;
  }

  &-body {
    padding: 20px;
    transition: all 250ms ease-in-out;
    visibility: visible;
    display: block;
  }
}
</style>
