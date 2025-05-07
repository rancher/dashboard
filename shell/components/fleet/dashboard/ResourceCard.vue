<script>
import ResourceCardSummary from '@shell/components/fleet/dashboard/ResourceCardSummary.vue';

export default {

  name: 'FleetDashboardResourceCard',

  emits: ['click'],

  components: { ResourceCardSummary },

  props: {
    value: {
      type:     Object,
      required: true
    },

    statePanel: {
      type:     Object,
      required: true
    },

    selected: {
      type:    Boolean,
      default: true
    }
  },

  methods: {
    select(value) {
      const tagName = value?.srcElement?.tagName;

      if (tagName === 'A' || tagName === 'BUTTON') {
        return;
      }

      this.$emit('click');
    },
  }
};
</script>

<template>
  <div
    role="button"
    tabindex="0"
    :aria-label="t(`card-${ value.id }`)"
    class="resource-card-panel"
    :class="{
      ['selected']: selected
    }"
    @click="select"
    @keydown.enter.stop.prevent="select"
    @keydown.space.stop.prevent="$router.push(value.detailLocation)"
  >
    <div class="title">
      <i
        class="icon-lg"
        :class="value.dashboardIcon"
      />
      <router-link
        role="link"
        tabindex="-1"
        :aria-label="value.nameDisplay"
        :to="value.detailLocation"
      >
        {{ value.nameDisplay }}
      </router-link>
    </div>
    <div class="body">
      <ResourceCardSummary
        :value="value"
        :state-panel="statePanel"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .resource-card-panel {
    border: 1px solid var(--modal-border);
    border-radius: 10px;
    padding: 10px;
    margin: 10px;

    &.selected {
      border: 2px solid var(--primary);
      margin: 9px;
    }

    .title {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 10px;
      font-size: medium;
    }
  }
</style>
