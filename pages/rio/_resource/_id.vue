<script>
import RioDetail, { asyncData } from '@/components/RioDetail';

export default {
  name:       'RioResourceId',
  components: { RioDetail },
  asyncData
};
</script>

<template>
  <RioDetail :async-data="_data" />
</template>
