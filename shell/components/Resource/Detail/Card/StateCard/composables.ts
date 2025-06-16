import { extractCounts, Props as ResourceRowProps } from '@shell/components/Resource/Detail/ResourceRow.vue';
import { useI18n } from '@shell/composables/useI18n';
import { INGRESS, SERVICE } from '@shell/config/types';
import { getHighestAlertColor } from '@shell/utils/style';
import { computed, Ref, toValue } from 'vue';
import { useStore } from 'vuex';
import { Props as StateCardProps } from '@shell/components/Resource/Detail/Card/StateCard/index.vue';
import { RouteLocationRaw } from 'vue-router';

export function useResourceCardRow(label: string, resources: any[], to?: RouteLocationRaw): ResourceRowProps {
  const colors = resources.map((r: any) => r.stateSimpleColor);
  const states = resources.map((r: any) => r.stateDisplay.toLowerCase());

  return {
    label,
    color:  resources.length ? getHighestAlertColor(colors) : undefined,
    counts: resources.length ? extractCounts(states) : undefined,
    to
  };
}

export interface Pairs {
    label: string;
    to?: RouteLocationRaw;
    resources: any[];
}

export function useDefaultResources(pairs: Ref<Pairs[]>) {
  const pairsValue = toValue(pairs);
  const rows = computed(() => pairsValue.map(({ label, resources, to }) => useResourceCardRow(label, resources, to)));

  return rows;
}

export function useResourcePair(label: string, type: string, resources?: any[]) {
  const store = useStore();

  return computed(() => {
    if (!resources) {
      return undefined;
    }

    const resourcesValue = toValue(resources);

    return {
      label,
      resources: resourcesValue,
      to:        (resourcesValue?.length > 0) ? {
        name:   'c-cluster-product-resource',
        params: {
          cluster:  store.getters.currentCluster.id,
          product:  store.getters.currentProduct.name,
          resource: type
        }
      } : undefined,
    };
  });
}

export function useDefaultWorkloadResources(services?: any[], ingresses?: any[], referredToBy?: any[], refersTo?: any[]): StateCardProps {
  const store = useStore();
  const i18n = useI18n(store);

  const pairs: Ref<(Pairs | undefined)[]> = computed(() => [
    useResourcePair(i18n.t('component.resource.detail.card.resourcesCard.rows.services'), SERVICE, services).value,
    useResourcePair(i18n.t('component.resource.detail.card.resourcesCard.rows.ingresses'), INGRESS, ingresses).value,
    referredToBy ? {
      label:     i18n.t('component.resource.detail.card.resourcesCard.rows.referredToBy'),
      resources: toValue(referredToBy || []),
      to:        { hash: '#related' }
    } : undefined,
    refersTo ? {
      label:     i18n.t('component.resource.detail.card.resourcesCard.rows.refersTo'),
      resources: toValue(refersTo || []),
      to:        { hash: '#related' }
    } : undefined
  ]);

  const remainingPairs = computed(() => pairs.value.filter((p: (Pairs | undefined)): p is Pairs => p !== undefined));

  const rows = useDefaultResources(remainingPairs);

  return {
    title: 'Resources',
    rows:  rows.value
  };
}

export function useDefaultWorkloadInsightsCardProps(): StateCardProps {
  const store = useStore();
  const i18n = useI18n(store);

  const rows: ResourceRowProps[] = [
    {
      label:  i18n.t('component.resource.detail.card.insightsCard.rows.conditions'),
      to:     '#',
      color:  'disabled',
      counts: [{ label: 'Available', count: 1 }, { label: 'Progressing', count: 1 }]
    },
    {
      label:  i18n.t('component.resource.detail.card.insightsCard.rows.events'),
      to:     '#',
      color:  'disabled',
      counts: [{ label: 'Normal', count: 2 }]
    }
  ];

  return {
    title: i18n.t('component.resource.detail.card.insightsCard.title'),
    rows
  };
}
