<script setup lang="ts">
/**
 * Component top render an announcement as a side panel
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
} = useDynamicContent(props, 'rhs');

</script>
<template>
  <div
    v-if="dynamicContent"
    :compact="true"
    :can-close="true"
    class="dc-side-panel mt-10"
  >
    <div class="dc-title-block">
      <DynamicContentIcon
        v-if="dynamicContent.data.icon"
        :icon="dynamicContent.data.icon"
        :class="{'mr-10': dynamicContent.data.icon }"
      />
      <div class="dc-title">
        {{ dynamicContent.title }}
      </div>
      <DynamicContentCloseButton
        :id="dynamicContent.id"
        class="dc-close-button"
      />
    </div>
    <div class="dc-content">
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
        :aria-label="t('dynamicContent.action.openSecondary')"
        class="btn btn-sm role-secondary"
        @click.stop.prevent="invokeAction(dynamicContent.secondaryAction)"
      >
        {{ dynamicContent.secondaryAction.label }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$dc-padding: 8px;

.dc-side-panel {
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;

  .dc-title-block {
    display: flex;
    flex: 1;
    align-items: center;
    border-bottom: 1px solid var(--border);
    padding: 0 $dc-padding;

    .dc-title {
      flex: 1;
      font-weight: bold;
      font-size: 14px;
    }
  }

  .dc-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: $dc-padding;

    .dc-message {
      font-size: 1em;
      line-height: 1.3em;
    }
  }

  .dc-actions {
    display: flex;
    justify-content: flex-end;
    padding: $dc-padding;
    gap: 10px;
  }
}
</style>
