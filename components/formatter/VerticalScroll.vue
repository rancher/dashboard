<script>
export default {
  props:
    {
      value: {
        type:     String,
        default:  ''
      }
    }
};
</script>

<template>
  <div class="vertical-scroll">
    {{ value }}
  </div>
</template>
