<script>
import RoleDeletionCheck from '@shell/promptRemove/mixin/roleDeletionCheck';
export default {
  name:   'GlobalRolePromptRemove',
  mixins: [RoleDeletionCheck],
  props:  {
    value: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    type: {
      type:     String,
      required: true
    }
  },
};
</script>

<template>
  <div>
    <template>
      {{ t('promptRemove.attemptingToRemove', { type }) }} <span
        v-html="resourceNames(names, plusMore, t)"
      ></span>
    </template>
    <div v-if="info" class="text info mb-10 mt-20">
      <span v-html="info" />
    </div>
    <div v-if="warning" class="text-warning mb-10 mt-20">
      {{ warning }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.text.info {
  display: flex;
  align-items: center;

  > span {
    margin-right: 5px;
  }
}
</style>
