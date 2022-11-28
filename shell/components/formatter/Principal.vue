<script>
import PrincipalComponent from '@shell/components/auth/Principal';

export default {
  components: { PrincipalComponent },
  props:      {
    value: {
      type:    String,
      default: ''
    },
  },
};
</script>

<template>
  <div>
    <PrincipalComponent
      :key="value"
      :value="value"
      :use-muted="false"
    />
  </div>
</template>
