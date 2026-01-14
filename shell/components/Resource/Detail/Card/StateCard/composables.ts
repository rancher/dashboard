import { Count, Props as ResourceRowProps } from '@shell/components/Resource/Detail/ResourceRow.types';
import { useI18n } from '@shell/composables/useI18n';
import { INGRESS, SERVICE } from '@shell/config/types';
import { isHigherAlert, StateColor } from '@shell/utils/style';
import { computed, Ref, toValue } from 'vue';
import { useStore } from 'vuex';
import { Props as StateCardProps } from '@shell/components/Resource/Detail/Card/StateCard/types';
import { RouteLocationRaw } from 'vue-router';

export function useResourceCardRow(label: string, resources: any[], stateColorKey = 'stateSimpleColor', stateDisplayKey = 'stateDisplay', to?: RouteLocationRaw): ResourceRowProps {
  const agg: any = {};

  resources.forEach((r: any) => {
    const state = r[stateDisplayKey]?.toLowerCase();
    const color = r[stateColorKey] || 'disabled';

    agg[state] = agg[state] || {
      color, label: state, count: 0
    };
    agg[state].count++;
  });

  interface Tuple extends Count {
    color: StateColor;
  }
  const tuples: Tuple[] = Object.values(agg);

  tuples.sort((left: any, right: any) => {
    if (isHigherAlert(left.color, right.color)) {
      return -1;
    }

    if (left.color !== right.color) {
      return 1;
    }

    if (left.count === right.count) {
      return 0;
    }

    return left.count > right.count ? -1 : 1;
  });

  return {
    label,
    color:  tuples.length ? tuples[0].color : undefined,
    counts: tuples.length ? tuples : undefined,
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
  const rows = computed(() => pairsValue.map(({ label, resources, to }) => useResourceCardRow(label, resources, undefined, undefined, to)));

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
      to:     '#conditions',
      color:  'disabled',
      counts: [{ label: 'Available', count: 1 }, { label: 'Progressing', count: 1 }]
    },
    {
      label:  i18n.t('component.resource.detail.card.insightsCard.rows.events'),
      to:     '#events',
      color:  'disabled',
      counts: [{ label: 'Normal', count: 2 }]
    }
  ];

  return {
    title: i18n.t('component.resource.detail.card.insightsCard.title'),
    rows
  };
}
