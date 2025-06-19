<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import { CONFIG_MAP } from '@shell/config/types';
import { useStore } from 'vuex';

const store = useStore();
const configMaps = await store.dispatch('cluster/findAll', { type: CONFIG_MAP });

</script>
<template>
  <DetailPage>
    <template #top-area>
      ConfigMap
    </template>
    <template #middle-area>
      {{ configMaps }}
    </template>
  </DetailPage>
</template>
