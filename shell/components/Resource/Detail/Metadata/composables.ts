import { Row as IdentifyingInformationRow } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/index.vue';
import { useDefaultIdentifyingInformation } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/composable';
import { useDefaultLabels } from '@shell/components/Resource/Detail/Metadata/Labels/composable';
import { useDefaultAnnotations } from '@shell/components/Resource/Detail/Metadata/Annotations/composable';
import { computed, toValue, Ref } from 'vue';

export const useBasicMetadata = (resource: any) => {
  const labels = useDefaultLabels(resource);
  const annotations = useDefaultAnnotations(resource);

  return {
    labels,
    annotations
  };
};

export const useDefaultMetadata = (resource: any, additionalIdentifyingInformation?: (IdentifyingInformationRow[] | Ref<IdentifyingInformationRow[]>)) => {
  const defaultIdentifyingInformation = useDefaultIdentifyingInformation(resource);
  const additionalIdentifyingInformationValue = toValue(additionalIdentifyingInformation);

  const identifyingInformation = computed(() => [...defaultIdentifyingInformation.value, ...(additionalIdentifyingInformationValue || [])]);
  const { labels, annotations } = useBasicMetadata(resource);

  return {
    identifyingInformation,
    labels,
    annotations
  };
};
