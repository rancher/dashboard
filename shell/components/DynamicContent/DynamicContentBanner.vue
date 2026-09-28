<script setup lang="ts">
/**
 * Component top render an announcement as a banner
 */
import DynamicContentIcon from './DynamicContentIcon.vue';
import DynamicContentCloseButton from './DynamicContentCloseButton.vue';
import Markdown from '@shell/components/Markdown.vue';
import { useDynamicContent, DynamicInputProps } from './content';

const props = defineProps<DynamicInputProps>();
const {
  dynamicContent,
  invokeAction,
  primaryButtonStyle,
} = useDynamicContent(props, 'banner');

</script>
<template>
  <div
    v-if="dynamicContent"
    class="home-page-dynamic-content"
  >
    <template v-if="dynamicContent.data">
      <DynamicContentIcon
        v-if="dynamicContent.data.icon"
        :icon="dynamicContent.data.icon"
        :class="{'mr-10': dynamicContent.data.icon }"
      />
    </template>
    <div class="dc-content">
      <div class="dc-title">
        {{ dynamicContent.title }}
      </div>
      <div class="dc-message">
        <Markdown
          v-if="dynamicContent.message"
          v-model:value="dynamicContent.message"
        />
      </div>
    </div>
    <div class="dc-actions">
      <button
        v-if="dynamicContent.primaryAction"
        role="button"
        class="btn btn-sm"
        :aria-label="t('dynamicContent.action.openPrimary')"
        :class="primaryButtonStyle"
        @click.stop.prevent="invokeAction(dynamicContent.primaryAction)"
      >
        {{ dynamicContent.primaryAction.label }}
      </button>
      <button
        v-if="dynamicContent.secondaryAction"
        role="button"
        class="btn btn-sm role-secondary"
        :aria-label="t('dynamicContent.action.openSecondary')"
        @click.stop.prevent="invokeAction(dynamicContent.secondaryAction)"
      >
        {{ dynamicContent.secondaryAction.label }}
      </button>
      <DynamicContentCloseButton
        :id="dynamicContent.id"
        class="dc-close-button"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .home-page-dynamic-content {
    background-color: var(--box-bg);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 10px;

    .dc-content {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .dc-title {
      font-weight: bold;
      font-size: 1.1em;
      margin-bottom: 4px;
    }

    .dc-message {
      font-size: 1em;
    }

    .dc-actions {
      display: flex;
      align-items: center;
      margin: 0 8px;
      gap: 10px;
    }
  }
</style>
