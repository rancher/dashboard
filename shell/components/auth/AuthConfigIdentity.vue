<script setup lang="ts">
/**
 * The name and description of an auth provider connection.
 *
 * Shown both when adding a provider and when editing one, so that an install
 * with several configs of the same provider can tell them apart. The name is
 * `metadata.name`, which the API rejects on update, so it is only editable
 * before the config exists.
 */
import { useStore } from 'vuex';
import { LabeledInput } from '@components/Form/LabeledInput';

withDefaults(defineProps<{
  name: string;
  description: string;
  /** The config exists, so its name can no longer be changed. */
  nameFixed?: boolean;
  /** Why the name cannot be used, when it can't. */
  nameError?: string | null;
}>(), { nameFixed: false, nameError: null });

const emit = defineEmits<{(e: 'update:name', value: string): void, (e: 'update:description', value: string): void }>();

const store = useStore();
const t = (key: string, args?: object) => store.getters['i18n/t'](key, args);
</script>

<template>
  <div class="auth-config-identity">
    <LabeledInput
      :value="name"
      :label="t('authConfig.create.name.label')"
      :required="!nameFixed"
      :disabled="nameFixed"
      :status="nameError ? 'error' : undefined"
      :sub-label="nameError || ''"
      data-testid="auth-config-name"
      @update:value="emit('update:name', $event)"
    />
    <LabeledInput
      :value="description"
      :label="t('authConfig.create.descriptionField.label')"
      :placeholder="t('authConfig.create.descriptionField.placeholder')"
      data-testid="auth-config-description"
      @update:value="emit('update:description', $event)"
    />
  </div>
</template>

<style lang="scss" scoped>
.auth-config-identity {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}
</style>
