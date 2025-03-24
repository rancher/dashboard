<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import PodsCard from '@shell/components/Resource/Detail/Card/PodsCard/index.vue';
import ResourcesCard from '@shell/components/Resource/Detail/Card/ResourcesCard.vue';
import InsightsCard from '@shell/components/Resource/Detail/Card/InsightsCard.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar.vue';

</script>
<template>
  <DetailPage>
    <template #top-area>
      <TitleBar
        resourceTypeLabel="CronJob"
        resourceTo="#"
        resourceName="hello-world"

        description="A CronJob creates Jobs on a repeating schedule."
        :badge="{label: 'Active', color: 'bg-success'}"
      />
    </template>
    <template #middle-area>
      <PodsCard />
      <ResourcesCard />
      <InsightsCard />
    </template>
    <template #bottom-area>
      <div>Bottom</div>
    </template>
  </DetailPage>
</template>
