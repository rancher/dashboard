<script>
export default {
  name:            'ReleaseNotes',
  layout:          'default',

};
</script>

<template>
  <span class="p-40" v-html="t('landing.releaseNotes', {}, true)"></span>
</template>
