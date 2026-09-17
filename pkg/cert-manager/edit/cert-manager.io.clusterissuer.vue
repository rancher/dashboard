<script>
import IssuerEdit from '../components/IssuerEdit.vue';

export default {
  name:         'CertManagerClusterIssuerEdit',
  components:   { IssuerEdit },
  inheritAttrs: false,
};
</script>

<template>
  <IssuerEdit
    v-bind="$attrs"
    :cluster-scoped="true"
  />
</template>
