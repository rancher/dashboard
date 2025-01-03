<script>
import RoleDetailEdit from '@shell/components/auth/RoleDetailEdit';

export default { emits: ['set-subtype'], components: { RoleDetailEdit } };
</script>
<template>
  <RoleDetailEdit
    v-bind="$attrs"
    @set-subtype="$emit('set-subtype', $event)"
  />
</template>
