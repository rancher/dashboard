<script lang="ts">
import { useRouter } from 'vue-router';
import { computed, ref, watch } from 'vue';
import { _CONFIG, _GRAPH } from '@shell/config/query-params';
import ButtonGroup from '@shell/components/ButtonGroup';
import { useCurrentView } from '@shell/components/Resource/Detail/ViewOptions/composable';
</script>

<script setup lang="ts">
const router = useRouter();

const currentView = useCurrentView();
const view = ref(currentView.value);
const viewOptions = computed(() => {
  return [
    {
      labelKey: 'resourceDetail.masthead.config',
      value:    _CONFIG,
    },
    {
      labelKey: 'resourceDetail.masthead.graph',
      value:    _GRAPH,
    }
  ];
});

watch(
  () => view.value,
  () => {
    router.push({ query: { view: view.value } });
  }
);
</script>

<template>
  <ButtonGroup
    v-if="viewOptions"
    v-model:value="view"
    :options="viewOptions"
  />
</template>
