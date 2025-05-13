<script setup lang="ts">
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import VerticalGap from '@shell/components/Resource/Detail/Card/VerticalGap.vue';
import StatusBar from '@shell/components/Resource/Detail/StatusBar.vue';
import StatusRow from '@shell/components/Resource/Detail/StatusRow.vue';

const error = 'var(--error)';
const info = 'var(--info)';
const success = 'var(--success)';

const healthSegments = [
  {
    color:   error,
    percent: 55
  },
  {
    color:   info,
    percent: 25
  },
  {
    color:   success,
    percent: 20
  }
];

</script>

<template>
  <Card title="Pods">
    <StatusBar :segments="healthSegments" />
    <VerticalGap />
    <div class="pod-distribution">
      <StatusRow
        :color="error"
        label="Init: 0/1"
        :count="3"
        :percent="60"
      />
      <StatusRow
        :color="info"
        label="ImagepullbackOff"
        :count="1"
        :percent="20"
      />
      <StatusRow
        :color="success"
        label="Running"
        :count="1"
        :percent="20"
      />
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.pod-distribution {
    display: flex;
    flex-direction: column;
}
</style>
