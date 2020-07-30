<script>
import { defaultAsyncData } from '@/components/ResourceDetail';

export default {
  name: 'EditRelease',

  asyncData(ctx) {
    return defaultAsyncData(ctx, 'chartInstallAction');
  },
};
</script>

<template>
  <div>Release</div>
</template>
