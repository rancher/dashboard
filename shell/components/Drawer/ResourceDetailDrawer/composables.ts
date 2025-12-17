import { useStore } from 'vuex';
import { getYaml } from '@shell/components/Drawer/ResourceDetailDrawer/helpers';
import { ConfigProps, YamlProps } from '@shell/components/Drawer/ResourceDetailDrawer/types';
import { inject, provide } from 'vue';

export async function useDefaultYamlTabProps(resource: any): Promise<YamlProps> {
  const yaml = await getYaml(resource);

  return {
    resource,
    yaml
  };
}

export function useDefaultConfigTabProps(resource: any): ConfigProps | undefined {
  const store = useStore();

  // You don't want to show the Config tab if there isn't a an edit page to show and you don't want to show it if there isn't
  // a detail page because we default to showing the existing edit page if the detail page doesn't exist. Showing them again
  // wouldn't be worth while.
  if (!store.getters['type-map/hasCustomEdit'](resource.type) || !store.getters['type-map/hasCustomDetail'](resource.type) || resource.disableResourceDetailDrawerConfigTab) {
    return;
  }

  return {
    resource,
    component:    store.getters['type-map/importEdit'](resource.type),
    resourceType: resource.type
  };
}

const IS_IN_RESOURCE_DETAIL_DRAWER_KEY = 'isInResourceDetailDrawerKey';

/**
 * Used to add a provide method which will indicate to all ancestors that they're inside the ResourceDetailDrawer. This is useful because we show
 * config page components both independently and within the ResourceDetailDrawer and we sometimes want to distinguish between the two use cases.
*/
export function useResourceDetailDrawerProvider() {
  provide(IS_IN_RESOURCE_DETAIL_DRAWER_KEY, true);
}

/**
 * A composable used to determine if the current component was instantiated as an ancestor of a ResourceDetailDrawer.
 * @returns true if the component is an ancestor of ResourceDetailDrawer, otherwise false
 */
export function useIsInResourceDetailDrawer() {
  return inject(IS_IN_RESOURCE_DETAIL_DRAWER_KEY, false);
}
