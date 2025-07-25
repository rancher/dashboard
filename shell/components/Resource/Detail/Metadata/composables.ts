import { Row as IdentifyingInformationRow } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/index.vue';
import { useDefaultIdentifyingInformation } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/composable';
import { useDefaultLabels } from '@shell/components/Resource/Detail/Metadata/Labels/composable';
import { useDefaultAnnotations } from '@shell/components/Resource/Detail/Metadata/Annotations/composable';
import { computed, toValue, Ref } from 'vue';
import { useResourceDetailDrawer } from '@shell/components/Drawer/ResourceDetailDrawer/composables';

export const useBasicMetadata = (resource: any) => {
  const labels = useDefaultLabels(resource);
  const annotations = useDefaultAnnotations(resource);
  const { openResourceDetailDrawer } = useResourceDetailDrawer();

  return computed(() => {
    return {
      labels:              labels.value,
      annotations:         annotations.value,
      onShowConfiguration: () => openResourceDetailDrawer(resource)
    };
  });
};

export const useDefaultMetadataProps = (resource: any, additionalIdentifyingInformation?: (IdentifyingInformationRow[] | Ref<IdentifyingInformationRow[]>)) => {
  const defaultIdentifyingInformation = useDefaultIdentifyingInformation(resource);
  const additionalIdentifyingInformationValue = toValue(additionalIdentifyingInformation);

  const identifyingInformation = computed(() => [...defaultIdentifyingInformation.value, ...(additionalIdentifyingInformationValue || [])]);
  const basicMetaData = useBasicMetadata(resource);
  const { openResourceDetailDrawer } = useResourceDetailDrawer();

  return computed(() => {
    return {
      identifyingInformation: identifyingInformation.value,
      labels:                 basicMetaData.value.labels,
      annotations:            basicMetaData.value.annotations,
      onShowConfiguration:    () => openResourceDetailDrawer(resource)
    };
  });
};
