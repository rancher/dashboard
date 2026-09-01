import { Annotation } from '@shell/components/Resource/Detail/Metadata/Annotations/index.vue';
import { computed, Ref, toValue } from 'vue';

export const useDefaultAnnotations = (resource: any): Ref<Annotation[]> => {
  const resourceValue = toValue(resource);

  return computed(() => {
    const keyValuePairs = Object.entries<string>(resourceValue.annotations || {});

    return keyValuePairs.map(([key, value]) => ({ key, value }));
  });
};
