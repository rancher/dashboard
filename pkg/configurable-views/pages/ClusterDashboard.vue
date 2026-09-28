<script setup lang="ts">
import StockClusterDashboard from '@shell/pages/c/_cluster/explorer/index.vue';
import PanelHost from '../components/PanelHost.vue';

// A cluster's dashboard, as a configurable page: its panels, with Rancher's own dashboard kept as
// one of them.
//
// One set of panels serves every cluster. A widget on them that names no cluster of its own follows
// the page's (see useWidgetCluster), so the same panel shows each cluster on its own dashboard.
</script>

<template>
  <PanelHost
    page="clusterDashboard"
    :stock="StockClusterDashboard"
    title="Cluster Dashboard"
    layout="default"
    first-panel-name="My dashboard"
  />
</template>
