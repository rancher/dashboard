import { useResourceDetailDrawer } from '@shell/components/Drawer/ResourceDetailDrawer/composables';
import { TitleBarProps } from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { computed, Ref, toValue } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

export const useDefaultTitleBarProps = (resource: any, resourceSubtype?: string): Ref<TitleBarProps> => {
  const route = useRoute();
  const store = useStore();
  const { openResourceDetailDrawer } = useResourceDetailDrawer();
  const resourceValue = toValue(resource);

  return computed(() => {
    const currentStore = store.getters['currentStore'](resourceValue.type);
    const schema = store.getters[`${ currentStore }/schemaFor`](resourceValue.type);
    const resourceTypeLabel = resourceValue.parentNameOverride || store.getters['type-map/labelFor'](schema);
    const resourceName = resourceSubtype ? `${ resourceSubtype } - ${ resourceValue.nameDisplay }` : resourceValue.nameDisplay;

    return {
      resourceTypeLabel,
      resourceTo: {
        name:   'c-cluster-product-resource',
        params: {
          product:   'explorer',
          cluster:   route.params.cluster,
          namespace: resourceValue.namespace,
          resource:  resourceValue.type
        }
      },
      resourceName,
      actionMenuResource: resourceValue,
      badge:              {
        color: resourceValue.stateBackground,
        label: resourceValue.stateDisplay
      },
      description:         resourceValue.description,
      onShowConfiguration: () => openResourceDetailDrawer(resourceValue)
    };
  });
};
