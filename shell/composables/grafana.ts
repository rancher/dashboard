import { allDashboardsExist } from '@shell/utils/grafana';
import { computed, Ref, toValue } from 'vue';
import { useStore } from 'vuex';

type StringReactive = string | Ref<string>;
type ArrayReactive<T> = T[] | Ref<T[]>;

export const useAllGrafanaDashboardExist = async(clusterId: StringReactive, embeddedUrls: ArrayReactive<string>, storeName?: StringReactive, projectId?: StringReactive) => {
  const store = useStore();

  const clusterIdValue = toValue(clusterId);
  const embeddedUrlsValue = toValue(embeddedUrls);
  const storeNameValue = toValue(storeName);
  const projectIdValue = toValue(projectId);

  return computed(async() => await allDashboardsExist(store, clusterIdValue, embeddedUrlsValue, storeNameValue, projectIdValue as any));
};
