<template>
  <div class="tab">
    <div class="tab-header">
      <div
        v-for="(tab, index) in tabs"
        :key="index"
        :class="{ 'active-tab': activeTab === index }"
        class="tab-item"
        @click="changeTab(index)"
      >
        <span>{{ tab.label }}<span /></span>
      </div>
    </div>
    <div class="tab-content">
      <div
        v-for="(tab, index) in tabs"
        :key="index"
      >
        <slot
          v-if="activeTab === index"
          :name="tab.name"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    initialTab: {
      type:    Number,
      default: 0
    },
    tabs: {
      type:     Array,
      required: true
    }
  },
  data() {
    return { activeTab: this.initialTab };
  },
  methods: {
    changeTab(index) {
      this.activeTab = index;
    }
  }
};
</script>

<style lang="scss" scoped>
.tab {
  font-family: Arial, sans-serif;
  border: solid thin var(--border);
  border-radius: 4px;
  .tab-header {
    display: flex;
    border-bottom: solid thin var(--border);
    .tab-item {
      padding: 15px;
      cursor: pointer;
      &:hover {
        background-color: #f0f0f0;
      }
    }
    .active-tab {
      border-bottom: solid 2px var(--primary);
      & > SPAN {
        color: var(--primary);
        text-decoration: none;
      }
    }
  }
  .tab-content {
    padding: 20px;
  }
}
</style>
