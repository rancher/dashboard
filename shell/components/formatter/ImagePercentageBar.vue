<script>
import ProgressBarMulti from '@shell/components/ProgressBarMulti';
export default {
  components: { ProgressBarMulti },

  props: {
    value: {
      type:    [String, Number],
      default: 0
    },
    row: {
      type:    Object,
      default: () => {}
    },
    col: {
      type:    Object,
      default: () => {}
    },
  },

  computed: {
    percentage() {
      const value = Number.parseFloat(this.value);
      let color = 'bg-success';

      if (value === 0) {
        color = 'bg-secondary';
      } else if (value < 30) {
        color = 'bg-darker';
      } else if (value < 70) {
        color = 'bg-warning';
      }

      return [{
        value,
        color
      }];
    },

    completed() {
      return Number.parseFloat(this.value) === 100;
    },
  },
};
</script>

<template>
  <div
    v-if="!completed"
    class="parent"
  >
    <div class="progress-box">
      <ProgressBarMulti
        :values="percentage"
        :min="0"
        :max="100"
      />
    </div>
    <div class="text">
      {{ value || 0 }}%
    </div>
  </div>
  <div v-else>
    {{ t('generic.completed') }}
  </div>
</template>

<style lang="scss" scoped>
.parent {
  display: grid;
  grid-template-areas: "progress text";
  grid-template-columns: auto 80px;
  align-items: center;
  .progress {
    background-color: darken(#EBEEF5, 15%);
    width: 100%;
  }
  .progress-box {
    grid-area: progress;
  }
  .text {
    grid-area: text;
    text-align: center;
  }
}
</style>
