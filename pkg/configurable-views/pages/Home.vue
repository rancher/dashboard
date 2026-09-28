<script setup lang="ts">
import StockHome from '@shell/pages/home.vue';
import ConfigurablePage from '../components/ConfigurablePage.vue';

// The Home, as a configurable page: its views, with Rancher's own Home kept as one of them.
</script>

<template>
  <ConfigurablePage
    page="home"
    :stock="StockHome"
    title="Home"
    layout="home"
    first-view-name="My Home"
  />
</template>
