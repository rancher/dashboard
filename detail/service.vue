<script>
import ServiceCreateEditView from '@/components/CreateEditView/Service';

export default { components: { ServiceCreateEditView } };
</script>

<template>
  <ServiceCreateEditView
    :props="$props"
    v-bind="$attrs"
  />
</template>
