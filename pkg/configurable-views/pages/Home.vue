<script setup lang="ts">
import StockHome from '@shell/pages/home.vue';
import PanelHost from '../components/PanelHost.vue';

// The Home, as a configurable page: its panels, with Rancher's own Home kept as one of them.
</script>

<template>
  <PanelHost
    page="home"
    :stock="StockHome"
    title="Home"
    layout="home"
    first-panel-name="My Home"
  />
</template>
