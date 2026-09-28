<script setup lang="ts">
import StockClusterDashboard from '@shell/pages/c/_cluster/explorer/index.vue';
import ConfigurablePage from '../components/ConfigurablePage.vue';

// A cluster's dashboard, as a configurable page: its views, with Rancher's own dashboard kept as
// one of them.
//
// One set of views serves every cluster. A widget on them that names no cluster of its own follows
// the page's (see useWidgetCluster), so the same view shows each cluster on its own dashboard.
</script>

<template>
  <ConfigurablePage
    page="clusterDashboard"
    :stock="StockClusterDashboard"
    title="Cluster Dashboard"
    layout="default"
    first-view-name="My dashboard"
  />
</template>
