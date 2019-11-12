<script>
import RioDetail, { watchQuery, asyncData } from '@/components/RioDetail';

export default {
  name:       'RioNamespaceResourceId',
  components: { RioDetail },
  asyncData,
  watchQuery
};
</script>

<template>
  <RioDetail v-bind="_data" />
</template>
