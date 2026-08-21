<script setup lang="ts">
import IssuerDetail from '../components/IssuerDetail.vue';

defineProps<{ value: any }>();
</script>

<template>
  <IssuerDetail :value="value" />
</template>
