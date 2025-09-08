import { Row as IdentifyingInformationRow } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/index.vue';
import { useDefaultIdentifyingInformation } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/composable';
import { useDefaultLabels } from '@shell/components/Resource/Detail/Metadata/Labels/composable';
import { useDefaultAnnotations } from '@shell/components/Resource/Detail/Metadata/Annotations/composable';
import { computed, toValue, Ref } from 'vue';
import {
  useLiveDate, useNamespace, useProject, useResourceDetails, useWorkspace
} from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/identifying-fields';

export const useBasicMetadata = (resource: any) => {
  const labels = useDefaultLabels(resource);
  const annotations = useDefaultAnnotations(resource);
  const resourceValue = toValue(resource);

  return computed(() => {
    return {
      resource:            toValue(resource),
      labels:              labels.value,
      annotations:         annotations.value,
      onShowConfiguration: () => resourceValue.showConfiguration()
    };
  });
};

export const useDefaultMetadataProps = (resource: any, additionalIdentifyingInformation?: (IdentifyingInformationRow[] | Ref<IdentifyingInformationRow[]>)) => {
  const defaultIdentifyingInformation = useDefaultIdentifyingInformation(resource);
  const additionalIdentifyingInformationValue = toValue(additionalIdentifyingInformation);

  const identifyingInformation = computed(() => [...defaultIdentifyingInformation.value, ...(additionalIdentifyingInformationValue || [])]);
  const basicMetaData = useBasicMetadata(resource);
  const resourceValue = toValue(resource);

  return computed(() => {
    return {
      resource:               toValue(resource),
      identifyingInformation: identifyingInformation.value,
      labels:                 basicMetaData.value.labels,
      annotations:            basicMetaData.value.annotations,
      onShowConfiguration:    (returnFocusSelector: string) => resourceValue.showConfiguration(returnFocusSelector)
    };
  });
};

export const useDefaultMetadataForLegacyPagesProps = (resource: any) => {
  const resourceDetails = useResourceDetails(resource);
  const project = useProject(resource);
  const workspace = useWorkspace(resource);
  const namespace = useNamespace(resource);
  const liveDate = useLiveDate(resource);
  const resourceValue = toValue(resource);

  const identifyingInformation = computed((): IdentifyingInformationRow[] => {
    const defaultInfo = [
      project?.value,
      workspace?.value,
      namespace?.value,
      liveDate?.value,
    ];
    const info = [
      ...defaultInfo,
      ...(resourceDetails?.value || [])
    ];

    return info.filter((info) => typeof info !== 'undefined');
  });
  const basicMetaData = useBasicMetadata(resource);

  return computed(() => {
    return {
      resource:               toValue(resource),
      identifyingInformation: identifyingInformation.value,
      labels:                 basicMetaData.value.labels,
      annotations:            basicMetaData.value.annotations,
      onShowConfiguration:    (returnFocusSelector?: string) => resourceValue.showConfiguration(returnFocusSelector)
    };
  });
};
