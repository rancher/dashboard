import { computed, ComputedRef, toValue } from 'vue';
import { Row } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/index.vue';
import {
  useCertificate,
  useExpires,
  useImage, useIssuer, useLiveDate, useNamespace, useProject, useReady, useSecretType,
  useServiceAccount
} from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/identifying-fields';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

export const useDefaultIdentifyingInformation = (resource: any): ComputedRef<Row[]> => {
  const namespace = useNamespace(resource);
  const liveDate = useLiveDate(resource);

  return computed(() => {
    return [
      namespace?.value,
      liveDate?.value
    ].filter((info) => typeof info !== 'undefined');
  });
};

export const useSecretIdentifyingInformation = (resource: any, isProjectSecret: boolean): ComputedRef<Row[]> => {
  const namespace = isProjectSecret ? undefined : useNamespace(resource);
  const project = isProjectSecret ? useProject(resource) : undefined;
  const age = useLiveDate(resource);
  const secretType = useSecretType(resource);
  const serviceAccount = useServiceAccount(resource);
  const certificate = useCertificate(resource);
  const issuer = useIssuer(resource);
  const expires = useExpires(resource);

  return computed(() => {
    const rows = [
      age?.value,
      namespace?.value,
      project?.value,
      secretType?.value,
      serviceAccount?.value,
      certificate?.value,
      issuer?.value,
      expires?.value,
    ];

    return rows.filter((r) => typeof r !== 'undefined');
  });
};

export const useDefaultWorkloadIdentifyingInformation = (resource: any): ComputedRef<Row[]> => {
  const store = useStore();
  const i18n = useI18n(store);

  const resourceValue = toValue(resource);
  const image = useImage(resource);
  const ready = useReady(resource);

  return computed(() => [
    image.value,
    ready.value,
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
