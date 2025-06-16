import { Props } from '@shell/components/Resource/Detail/Card/ResourceUsageCard/index.vue';
import { useI18n } from '@shell/composables/useI18n';
import { computed } from 'vue';
import { useStore } from 'vuex';

export const useCpuUsageCardDefaultProps = (resource: any): Props => {
  const store = useStore();
  const i18n = useI18n(store);

  //   const resourceValue = toValue(resource);

  return computed(() => {
    return {
      title:     i18n.t('component.resource.detail.card.resourceUsage.cpu'),
      used:      1.20,
      available: 1.93
    };
  }).value;
};

export const useMemoryUsageCardDefaultProps = (resource: any): Props => {
  const store = useStore();
  const i18n = useI18n(store);

  //   const resourceValue = toValue(resource);

  return computed(() => {
    return {
      title:              i18n.t('component.resource.detail.card.resourceUsage.memory'),
      used:               870,
      available:          3290,
      availableFormatter: (n: number) => (n / 1000).toFixed(2),
      unit:               'GiB',
    };
  }).value;
};

export const usePodUsageCardDefaultProps = (resource: any): Props => {
  const store = useStore();
  const i18n = useI18n(store);

  //   const resourceValue = toValue(resource);

  return computed(() => {
    return {
      title:     i18n.t('component.resource.detail.card.resourceUsage.pods'),
      used:      9,
      available: 17
    };
  }).value;
};
