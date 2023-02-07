<script lang="ts">
import Vue from 'vue';
import ActivityBarBody from './ActivityBarBody.vue';
import ActivityBarMenu from './ActivityBarMenu.vue';

export default Vue.extend({
  name:       'ActivityBar',
  components: {
    ActivityBarBody,
    ActivityBarMenu,
  },
  props: {
    activities: {
      type:     Array,
      required: true,
    }
  },
  data() {
    return { isExpanded: false };
  },
  methods: {
    toggleExpansion() {
      this.isExpanded = !this.isExpanded;
    }
  },
});
</script>

<template>
  <div
    class="activity-bar"
    :class="{
      'activity-bar-expanded': isExpanded,
      'activity-bar-collapsed': !isExpanded
    }"
  >
    <activity-bar-menu
      @click="toggleExpansion"
    />
    <activity-bar-body
      v-if="activities"
      :activities="activities"
      :is-expanded="isExpanded"
    />
  </div>
</template>

<style lang="scss" scoped>
  .activity-bar {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    background: var(--primary-900) 0% 0% no-repeat padding-box;
    box-shadow: 4px 3px 6px #00000029;
    opacity: 1;
    z-index: 99;
    padding: 0 0.75rem;
    width: 100%;
    transition: width 0.25s ease;
    overflow: hidden;

    &.activity-bar-expanded {
      width: 16rem;
    }

    &.activity-bar-collapsed {
      width: 100%;
    }
  }
</style>
