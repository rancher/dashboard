<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

const props = defineProps<{
  message: string;
  maxLines?: number;
}>();

const emit = defineEmits<{
  expand: [];
}>();

const store = useStore();
const { t } = useI18n(store);

const isExpanded = ref(false);
const messageContainer = ref<HTMLElement>();

const maxLines = computed(() => props.maxLines || 3);

const expand = () => {
  isExpanded.value = true;
  emit('expand');
};
</script>

<template>
  <div
    class="truncated-message"
    :aria-expanded="isExpanded"
  >
    <span
      v-if="!isExpanded"
      ref="messageContainer"
      class="truncated-text"
      :style="{ '-webkit-line-clamp': maxLines }"
      :aria-label="message"
    >{{ message }}</span>
    <span
      v-if="!isExpanded"
      class="ellipsis-suffix"
    >
      ...&nbsp;<a
        class="read-more-link"
        href="#"
        :aria-label="`${t('generic.readMore')}: ${message}`"
        @click.prevent="expand"
      >{{ t('generic.readMore') }}</a>
    </span>
    <span v-else>{{ message }}</span>
  </div>
</template>

<style lang="scss" scoped>
.truncated-message {
  .truncated-text {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ellipsis-suffix {
    white-space: nowrap;
  }

  .read-more-link {
    color: var(--link);
    text-decoration: underline;
    cursor: pointer;

    &:hover {
      color: var(--link-hover);
    }
  }
}
</style>
