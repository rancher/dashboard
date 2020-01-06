<script>
export default { props: { title: { type: String, default: '' } } };
</script>

<template>
  <div>
    <span>{{ title }}</span>
    <span><slot /></span>
  </div>
</template>
