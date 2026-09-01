<script>
export default { props: { value: { type: String, required: true } } };
</script>

<template>
  <a
    rel="nofollow noopener noreferrer"
    target="_blank"
    :href="value"
  >{{ value }}</a>
</template>
