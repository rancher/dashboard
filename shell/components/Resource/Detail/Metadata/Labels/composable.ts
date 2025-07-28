import { Label } from '@shell/components/Resource/Detail/Metadata/Labels/index.vue';
import { computed, Ref, toValue } from 'vue';

export const useDefaultLabels = (resource: any): Ref<Label[]> => {
  const resourceValue = toValue(resource);

  return computed(() => {
    const entries = Object.entries<string>(resourceValue.labels || {});

    return entries.map(([key, value]) => ({ key, value }));
  });
};
