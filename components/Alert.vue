<script>
import VStack from '@/components/Layout/Stack/VStack';

const STATUS_CLASS_MAP = {
  success: {
    container: 'text-success',
    icon:      'icon-x'
  },
  warning: {
    container: 'text-warning',
    icon:      'icon-x'
  },
  info: {
    container: 'text-info',
    icon:      'icon-x'
  },
  error: {
    container: 'alert-bg-error text-error',
    icon:      'icon-x'
  }
};

export default {
  components: { VStack },
  props:      {
    status: {
      type: String,
      validator(value) {
        return Object.keys(STATUS_CLASS_MAP).includes(value);
      },
      required: true
    },
    message: {
      type:     String,
      required: true
    }
  },
  computed: {
    containerClasses() {
      return STATUS_CLASS_MAP[this.status].container;
    },
    iconClasses() {
      return STATUS_CLASS_MAP[this.status].icon;
    }
  }
};
</script>

<template>
  <VStack class="alert" :class="containerClasses" vertical-align="center">
    <div><i class="icon" :class="iconClasses" /> {{ message }}</div>
  </VStack>
</template>

<style lang="scss" scoped>
.alert-bg-error {
    background-color: rgba(var(--error), 0.5)
}
</style>
