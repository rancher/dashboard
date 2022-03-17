<template>
  <div>
    <ul v-for="(val, key) in data" :key="key">
      <li>
        <p>
          <span class="more-info-item-label">{{ key }}:</span>
          <span class="more-info-item-value">{{ val }}</span>
        </p>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name:  'InfoBox',
  props: {
    data: {
      type:     Object,
      required: true
    }
  }
};
</script>

<style lang="scss" scoped>

</style>
