<script>
import IssuerEdit from '../components/IssuerEdit.vue';

export default {
  name:         'CertManagerIssuerEdit',
  components:   { IssuerEdit },
  inheritAttrs: false,
};
</script>

<template>
  <IssuerEdit
    v-bind="$attrs"
    :cluster-scoped="false"
  />
</template>
