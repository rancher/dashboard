import { computed, ComputedRef, toValue } from 'vue';
import { Row } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/index.vue';
import {
  useCertificate,
  useExpires,
  useImage, useIssuer, useLiveDate, useNamespace, useReady, useSecretType,
  useServiceAccount
} from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/identifying-fields';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

export const useDefaultIdentifyingInformation = (resource: any): ComputedRef<Row[]> => {
  return computed(() => {
    const namespace = useNamespace(resource);
    const liveDate = useLiveDate(resource);

    return [
      namespace.value,
      liveDate.value
    ];
  });
};

export const useSecretIdentifyingInformation = (resource: any): ComputedRef<Row[]> => {
  return computed(() => {
    const rows = [
      useSecretType(resource),
      useServiceAccount(resource),
      useCertificate(resource),
      useIssuer(resource),
      useExpires(resource),
    ];

    return rows
      .filter((r) => typeof r !== 'undefined')
      .map((r) => r.value);
  });
};

export const useDefaultWorkloadIdentifyingInformation = (resource: any): ComputedRef<Row[]> => {
  const store = useStore();
  const i18n = useI18n(store);

  const resourceValue = toValue(resource);

  return computed(() => [
    useImage(resource).value,
    useReady(resource).value,
    {
      label: i18n.t('component.resource.detail.metadata.identifyingInformation.up-to-date'),
      value: resourceValue.upToDate,
    },
    {
      label: i18n.t('component.resource.detail.metadata.identifyingInformation.available'),
      value: resourceValue.available,
    },
  ]);
};
