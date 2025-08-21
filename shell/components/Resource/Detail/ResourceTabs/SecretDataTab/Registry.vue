<script lang="ts">
import DetailText from '@shell/components/DetailText.vue';

export interface Props {
  registryUrl?: string;
}
</script>

<script setup lang="ts">
const props = defineProps<Props>();
</script>

<template>
  <div class="row secret-data-registry">
    <div class="col span-12 registry-url">
      <DetailText
        :value="props.registryUrl"
        label-key="secret.registry.domainName"
      />
    </div>
  </div>
</template>
