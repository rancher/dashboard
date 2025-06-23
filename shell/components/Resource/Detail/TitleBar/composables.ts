import { useResourceDetailDrawer } from '@shell/components/Drawer/ResourceDetailDrawer/composables';
import { TitleBarProps } from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { computed, Ref, toValue } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

export const useDefaultTitleBarProps = (resource: any): Ref<TitleBarProps> => {
  const route = useRoute();
  const store = useStore();
  const { openResourceDetailDrawer } = useResourceDetailDrawer();
  const resourceValue = toValue(resource);

  return computed(() => ({
    resourceTypeLabel: store.getters['type-map/labelFor']({ id: resourceValue.type }),
    resourceTo:        {
      name:   'c-cluster-product-resource',
      params: {
        product:   'explorer',
        cluster:   route.params.cluster,
        namespace: resourceValue.namespace,
        resource:  resourceValue.type
      }
    },
    resourceName:       resourceValue.nameDisplay,
    actionMenuResource: resourceValue,
    badge:              {
      color: resourceValue.stateBackground,
      label: resourceValue.stateDisplay
    },
    description:         resourceValue.description,
    onShowConfiguration: () => openResourceDetailDrawer(resourceValue)
  }));
};
