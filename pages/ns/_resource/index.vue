
<template>
  <ResourceTable :resource="$route.params.resource" :rows="rows" />
</template>

<script>
import ResourceTable from '@/components/ResourceTable';

export default {
  components: { ResourceTable },

  asyncData(ctx) {
    return ctx.store.dispatch('v1/findAll', { type: ctx.params.resource }).then((rows) => {
      return { rows };
    });
  },
};
</script>
