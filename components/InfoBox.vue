<script>
export default {};
</script>

<template>
  <div class="info-box">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
 .info-box {
   background-color: var(--tabbed-container-bg);
   border: 1px solid var(--tabbed-border);
   padding: 20px;
   border-radius: var(--border-radius);
   .info-column:not(:last-child) {
     border-right: 1px solid var(--tabbed-border);
   }
   .info-row {
     margin-bottom: 10px;
     label {
       color: var(--input-label);
     }
   }
 }
</style>
