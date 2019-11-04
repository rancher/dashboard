<script>
import ExplorerDetail, { asyncData } from '@/components/ExplorerDetail';

export default {
  name:       'ExplorerGroupResourceId',
  components: { ExplorerDetail },
  asyncData
};
</script>

<template>
  <ExplorerDetail :async-data="_data" />
</template>
