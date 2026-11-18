import { Label } from '@shell/components/Resource/Detail/Metadata/Labels/index.vue';
import { computed, Ref, toValue } from 'vue';

export const useDefaultLabels = (resource: any): Ref<Label[]> => {
  const resourceValue = toValue(resource);

  return computed(() => {
    // A model that knows which of its labels are system labels exposes the rest as
    // `filteredSystemLabels`. Honour it, as the legacy DetailTop does, so a resource shows the
    // same labels in a list as it does on its detail page.
    const labels = resourceValue.filteredSystemLabels || resourceValue.labels || {};
    const entries = Object.entries<string>(labels);

    return entries.map(([key, value]) => ({ key, value }));
  });
};
