<script>
import RioDetail, { watchQuery, asyncData } from '@/components/RioDetail';

export default {
  name:       'RioResourceId',
  components: { RioDetail },
  asyncData,
  watchQuery,
};
</script>

<template>
  <RioDetail :async-data="_data" />
</template>
