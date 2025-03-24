import { useI18n } from '@shell/composables/useI18n';
import { computed, toValue } from 'vue';
import { useStore } from 'vuex';
import { POD, WORKLOAD_TYPES } from '@shell/config/types';
import { WORKLOAD_SCHEMA } from '@shell/config/schema';
import { flatten, compact, values } from 'lodash';
import {
  EFFECT, KEY, VALUE, SIMPLE_NAME, IMAGE_SIZE
} from '@shell/config/table-headers';
import { Props } from '@shell/components/Resource/Detail/ResourceTabs/ResourceTableTab/index.vue';

export const useGetDefaultImagesTabProps = (node: any): Props => {
  const store = useStore();
  const i18n = useI18n(store);
  const nodeValue = toValue(node);

  const rows = computed(() => {
    const images = nodeValue.status.images || [];

    return images.map((image: any) => ({
      // image.names[1] typically has the user friendly name but on occasion there's only one name and we should use that
      name:      image.names ? (image.names[1] || image.names[0]) : '---',
      sizeBytes: image.sizeBytes
    }));
  });

  const headers = [
    { ...SIMPLE_NAME, width: null },
    { ...IMAGE_SIZE, width: 100 } // Ensure one header has a size, all other columns will scale
  ];

  return {
    name:         i18n.t('node.detail.tab.images'),
    tableHeaders: { headers },
    rows:         rows.value
  };
};

export const useGetDefaultNodeInfoTabProps = (node: any): Props => {
  const store = useStore();
  const i18n = useI18n(store);
  const nodeValue = toValue(node);

  const headers = [
    {
      ...KEY,
      label: '',
      width: 200
    },
    {
      ...VALUE,
      label:       '',
      dashIfEmpty: true,
    }
  ];

  const rows = computed(() => {
    return Object.keys(nodeValue.status.nodeInfo)
      .map((key) => ({
        key:   i18n.t(`node.detail.tab.info.key.${ key }`),
        value: nodeValue.status.nodeInfo[key]
      }));
  });

  return {
    name:         i18n.t('node.detail.tab.info.label'),
    tableHeaders: { headers },
    rows:         rows.value
  };
};

export const useFetchDefaultPodsTabProps = async(resource: any): Promise<Props> => {
  const store = useStore();
  const i18n = useI18n(store);

  const resourceValue = toValue(resource);

  await store.dispatch('cluster/findAll', { type: POD });
  const schema = store.getters['cluster/schemaFor'](POD);

  return {
    name:         i18n.t('tableHeaders.pods'),
    rows:         resourceValue.pods,
    tableHeaders: { schema }
  };
};

export const useGetDefaultTaintsTabProps = (node: any): Props => {
  const store = useStore();
  const i18n = useI18n(store);

  const nodeValue = toValue(node);

  const rows = computed(() => {
    return nodeValue.spec.taints || [];
  });

  const headers = [
    KEY,
    VALUE,
    EFFECT
  ];

  return {
    name:         i18n.t('node.detail.tab.taints'),
    tableHeaders: { headers },
    rows:         rows.value
  };
};

export const useFetchDefaultWorkloadTabProps = async(namespaceId: string): Promise<Props> => {
  const store = useStore();
  const i18n = useI18n(store);
  const inStore = store.getters['currentProduct'].inStore;

  const getAllWorkloads = () => {
    return Promise.all(values(WORKLOAD_TYPES)
    // You may not have RBAC to see some of the types
      .filter((type: string) => Boolean(store.getters[`${ inStore }/schemaFor`](type)))
    // findAll on each workload type here, argh! however...
    // - results are shown in a single table containing all workloads rather than an SSP compatible way (one table per type)
    // - we're restricting by namespace. not great, but a big improvement
      .map((type: string) => store.dispatch('cluster/findAll', { type, opt: { namespaced: namespaceId } }))
    );
  };

  const allWorkloads = await getAllWorkloads();
  const rows = computed(() => {
    return flatten(compact(allWorkloads)).filter((row) => !row.ownedByWorkload);
  });

  return {
    name:         i18n.t('namespace.workloads'),
    tableHeaders: { schema: WORKLOAD_SCHEMA },
    rows:         rows.value
  };
};
