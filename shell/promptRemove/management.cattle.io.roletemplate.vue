<script>
import RoleDeletionCheck from '@shell/promptRemove/mixin/roleDeletionCheck';
export default {
  name:   'RoleTemplatePromptRemove',
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
    {{ t('promptRemove.attemptingToRemove', { type }) }} <span
      v-clean-html="resourceNames(names, t)"
    />
    <div
      v-if="info"
      class="text info mb-10 mt-20"
    >
      <span v-clean-html="info" />
    </div>
    <div
      v-if="warning"
      class="text-warning mb-10 mt-20"
    >
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
