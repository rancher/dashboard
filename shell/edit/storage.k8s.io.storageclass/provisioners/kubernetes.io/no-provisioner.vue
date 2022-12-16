<script>
export default {
  props: {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true
    }
  }
};
</script>
<template>
  <div>
    <div class="row mb-10">
      {{ t('generic.na') }}
    </div>
  </div>
</template>
