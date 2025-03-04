<script setup lang="ts">

const STATUS = {
  success: {
    color: 'text-success',
    icon:  'icon-checkmark'
  },
  warning: {
    color: 'text-warning',
    icon:  'icon-warning'
  },
  info: {
    color: 'text-info',
    icon:  'icon-info'
  },
  error: {
    color: 'text-error',
    icon:  'icon-error'
  }
};

const { status = 'success', label } = defineProps<{
  status?: 'success' | 'warning' | 'info' | 'error',
  label?: string
}>();

</script>
<template>
  <div
    class="status-badge"
  >
    <i
      class="status-badge__icon icon"
      :class="{
        [STATUS[status].icon]: true,
        [STATUS[status].color]: true
      }"
    />
    <div
      v-if="label"
      class="status-badge__label"
    >
      {{ label }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.status-badge {
  align-items: center;
  display: inline-flex;
  border: 1px solid;
  border-color: var(--border);
  margin-top: 20px;

  & + & {
    margin-left: 20px;
  }

  &__label {
    border-left: 1px solid var(--border);
    padding: 5px 20px;
  }

  &__icon {
    text-align: center;
    padding: 5px 10px;
  }
}
</style>
