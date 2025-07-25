import ResourceDetailDrawer from '@shell/components/Drawer/ResourceDetailDrawer/index.vue';
import { Props as YamlTabProps } from '@shell/components/Drawer/ResourceDetailDrawer/YamlTab.vue';
import { Props as ConfigTabProps } from '@shell/components/Drawer/ResourceDetailDrawer/ConfigTab.vue';
import { useStore } from 'vuex';
import { useDrawer } from '@shell/composables/drawer';
import { getYaml } from '@shell/components/Drawer/ResourceDetailDrawer/helpers';

export function useResourceDetailDrawer() {
  const { open, close } = useDrawer();

  const openResourceDetailDrawer = (resource: any) => {
    open(ResourceDetailDrawer, {
      resource,
      onClose:   close,
      width:     '73%',
      // We want this to be full viewport height top to bottom
      height:    '100vh',
      top:       '0',
      'z-index': 101 // We want this to be above the main side menu
    });
  };

  return { openResourceDetailDrawer };
}

export async function useDefaultYamlTabProps(resource: any): Promise<YamlTabProps> {
  const yaml = await getYaml(resource);

  return {
    resource,
    yaml
  };
}

export function useDefaultConfigTabProps(resource: any): ConfigTabProps | undefined {
  const store = useStore();

  if (!store.getters['type-map/hasCustomEdit'](resource.type)) {
    return;
  }

  return {
    resource,
    component: store.getters['type-map/importEdit'](resource.type)
  };
}
