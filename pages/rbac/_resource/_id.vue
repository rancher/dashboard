<script>
import RioDetail, { watchQuery, asyncData } from '@/components/RioDetail';

export default {
  name:       'RbacResourceId',
  components: { RioDetail },
  asyncData,
  watchQuery,
};
</script>

<template>
  <RioDetail v-bind="_data" />
</template>
