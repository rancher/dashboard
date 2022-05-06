<script>
import ChartReadme from '@shell/components/ChartReadme';
import Window from './Window';

export default {
  components: { Window, ChartReadme },

  props:      {
    // The definition of the tab itself
    tab: {
      type:     Object,
      required: true,
    },

    // Is this tab currently displayed
    active: {
      type:     Boolean,
      required: true,
    },

    versionInfo: {
      type:     Object,
      required: true,
    }
  },

};
</script>

<template>
  <Window :active="active">
    <template #body>
      <ChartReadme :version-info="versionInfo" class="chart-container" />
    </template>
  </Window>
</template>

<style lang="scss" scoped>
  .chart-container {
    height: 100%;
    overflow: auto;
    padding: 15px;
  }

</style>
