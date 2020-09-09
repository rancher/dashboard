<script>
export default {
  props: {
    label: {
      type:     String,
      required: true
    },
    url: {
      type:     String,
      required: true
    }
  }
};
</script>

<template>
  <div class="chart-heading">
    <h1>{{ t('chartHeading.overview') }}</h1>
    {{ t('chartHeading.poweredBy') }} <a :href="url" rel="nofollow noopener noreferrer" target="_blank">{{ label }}</a>
  </div>
</template>
