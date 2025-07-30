import { Props as YamlTabProps } from '@shell/components/Drawer/ResourceDetailDrawer/YamlTab.vue';
import { Props as ConfigTabProps } from '@shell/components/Drawer/ResourceDetailDrawer/ConfigTab.vue';
import { useStore } from 'vuex';
import { getYaml } from '@shell/components/Drawer/ResourceDetailDrawer/helpers';

export async function useDefaultYamlTabProps(resource: any): Promise<YamlTabProps> {
  const yaml = await getYaml(resource);

  return {
    resource,
    yaml
  };
}

export function useDefaultConfigTabProps(resource: any): ConfigTabProps | undefined {
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
