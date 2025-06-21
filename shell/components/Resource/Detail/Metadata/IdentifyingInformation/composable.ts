import { useI18n } from '@shell/composables/useI18n';
import { computed, ComputedRef, markRaw, toValue } from 'vue';
import LiveDate from '@shell/components/formatter/LiveDate.vue';
import { useStore } from 'vuex';
import { Row } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/index.vue';

export const useLiveDate = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label:         i18n.t('component.resource.detail.metadata.identifyingInformation.age'),
    valueOverride: {
      component: markRaw(LiveDate),
      props:     { value: resourceValue.creationTimestamp }
    },
    value: resourceValue.age,
  }));
};

export const useDefaultIdentifyingInformation = (resource: any): ComputedRef<Row[]> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);
  const liveDate = useLiveDate(resource);

  return computed(() => [
    {
      label: i18n.t('component.resource.detail.metadata.identifyingInformation.namespace'),
      value: resourceValue.namespace,
    },
    liveDate.value
  ]);
};
