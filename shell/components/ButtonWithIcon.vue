
<script lang="ts">
export type Role = 'primary' | 'secondary' | 'tertiary' | 'link';

export interface Props {
  role: Role;
  iconClass?: string;
  imagePath?: any;
}
</script>

<script lang="ts" setup>

const { iconClass, imagePath, role } = defineProps<Props>();
const emit = defineEmits(['click']);

const roleClass = `role-${ role }`;
</script>

<template>
  <button
    :class="{btn: true, [roleClass]: true}"
    @click="(...args) => emit('click', ...args)"
  >
    <span
      v-if="iconClass || imagePath"
      class="mmr-3"
    >
      <i
        v-if="iconClass"
        :class="{icon: true, [iconClass]: true}"
      />
      <img
        v-else-if="imagePath"
        :src="imagePath"
      >
    </span>
    <span>
      <slot name="default" />
    </span>
  </button>
</template>

<style lang="scss" scoped>
button {
  display: inline-flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  & > span {
    display: inline-flex;
    flex-direction: column;
    justify-content: center;
  }
}
</style>
