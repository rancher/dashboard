import { randomStr } from '@shell/utils/string';
import { sum } from 'lodash';
import { computed, inject, provide, ref } from 'vue';
import { RouteLocation } from 'vue-router';

const UPDATE_COUNT_PROVIDER_KEY = 'update-count';
const USE_COUNTS_KEY = 'is-inside-resource-tabs';

const UPDATE_RESOURCES_PROVIDER_KEY = 'update-resources';

type UpdateCountFn = (key: string, count: number | undefined) => void;

export interface ResourceLedger {
  [key: string]: {
    label?: string;
    location?: RouteLocation;
    resources?: any[];
  }
}

const resourceLedger = ref<ResourceLedger>({});

export const useIndicateUseCounts = () => {
  provide(USE_COUNTS_KEY, true);
};

export const useTabCountWatcher = () => {
  if (!inject<boolean>(USE_COUNTS_KEY, false)) {
    return { isCountVisible: ref<boolean>(false) };
  }

  const countLedger = ref<{ [key: string]: number | undefined }>({});

  const isCountVisible = computed(() => {
    // Some tables are destroyed and recreated depending on visibility so we count keys
    // to check if a table has been present in the tab even if the count has been cleared
    return Object.keys(countLedger.value).length > 0;
  });

  const count = computed(() => {
    return sum(Object.values(countLedger.value).map((count) => count || 0));
  });

  const updateCount = (key: string, count: number | undefined) => {
    countLedger.value[key] = count;
  };

  provide(UPDATE_COUNT_PROVIDER_KEY, updateCount);

  return { isCountVisible, count };
};

export const useTabCountUpdater = () => {
  const tabKey = randomStr();
  const updateCount = inject<UpdateCountFn>(UPDATE_COUNT_PROVIDER_KEY, () => { });

  const updateTabCount = (count: number | undefined) => {
    updateCount(tabKey, count);
  };

  const clearTabCount = () => updateTabCount(undefined);

  return {
    updateTabCount,
    clearTabCount
  };
};

export const useTabResourceUpdater = () => {
  const tabKey = randomStr();
  const updateResources = inject<any>(UPDATE_RESOURCES_PROVIDER_KEY);

  const updateTabResources = (resources?: any[]) => {
    console.log('rrrrr', resources);
    updateResources?.(tabKey, resources);
  };

  const clearTabResources = () => updateTabResources(undefined);

  return {
    updateTabResources,
    clearTabResources
  };
};

export const useTabResourceNamer = () => {
  if (!inject<boolean>(USE_COUNTS_KEY, false)) {
    return;
  }

  const keys = ref<string[]>([]);

  const updateResources = (key: string, resources: any[] | undefined) => {
    keys.value.push(key);

    resourceLedger.value[key] = resourceLedger.value[key] || { resources: [] };
    resourceLedger.value[key].resources = resources;

    console.log('llll', resourceLedger.value);
  };

  provide(UPDATE_RESOURCES_PROVIDER_KEY, updateResources);

  const nameResources = (name: string, location?: RouteLocation) => {
    keys.value.forEach((key) => {
      resourceLedger.value[key].label = name;
      resourceLedger.value[key].location = location;
    });
  };

  return { nameResources };
};
