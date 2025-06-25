import { useI18n } from '@shell/composables/useI18n';
import { computed, ComputedRef, toValue } from 'vue';
import { useStore } from 'vuex';
import { NAMESPACE, FLEET } from '@shell/config/types';
import { Row } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/index.vue';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet';
import { useRoute } from 'vue-router';

export const useNamespace = (resource: any): ComputedRef<Row> | undefined => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  if (!resourceValue.namespace || resourceValue.namespaces) {
    return;
  }

  return computed(() => {
    const to = resourceValue.namespaceLocation || {
      name:   `c-cluster-product-resource-id`,
      params: {
        product:  store.getters['productId'],
        cluster:  store.getters['clusterId'],
        resource: NAMESPACE,
        id:       resourceValue.namespace
      }
    };

    return {
      label:           i18n.t('component.resource.detail.metadata.identifyingInformation.namespace'),
      value:           resourceValue.namespace,
      valueDataTestid: 'masthead-subheader-namespace',
      to
    };
  });
};

export const useWorkspace = (resource: any): ComputedRef<Row> | undefined => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);
  const route = useRoute();

  const isWorkspace = store.getters['productId'] === FLEET_NAME && !!resourceValue?.metadata?.namespace;

  if (!isWorkspace) {
    return;
  }

  return computed(() => ({
    label: i18n.t('component.resource.detail.metadata.identifyingInformation.workspace'),
    value: resourceValue.namespace,
    to:    {
      name:   `c-cluster-product-resource-id`,
      params: {
        product:  store.getters['productId'],
        cluster:  store.getters['clusterId'],
        resource: FLEET.WORKSPACE,
        id:       route.params.namespace
      }
    }
  }));
};

export const useLiveDate = (resource: any): ComputedRef<Row> | undefined => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  const options = store.getters[`type-map/optionsFor`](resource.type);

  if (!options.showAge) {
    return;
  }

  return computed(() => ({
    label:         i18n.t('component.resource.detail.metadata.identifyingInformation.age'),
    valueOverride: {
      component: 'LiveDate',
      props:     { value: resourceValue.creationTimestamp }
    },
    value: resourceValue.creationTimestamp,
  }));
};

export const useCreatedBy = (resource: any): ComputedRef<Row> | undefined => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  if (!resourceValue.showCreatedBy) {
    return;
  }

  return computed(() => {
    const to = resourceValue.createdBy.location || undefined;

    return {
      label:           i18n.t('component.resource.detail.metadata.identifyingInformation.createdBy'),
      value:           resourceValue.createdBy.displayName,
      to,
      dataTestid:      'masthead-subheader-createdBy',
      valueDataTestid: to ? 'masthead-subheader-createdBy-link' : 'masthead-subheader-createdBy_plain-text'
    };
  });
};

export const useProject = (resource: any): ComputedRef<Row> | undefined => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  if (resource.type !== NAMESPACE || !resourceValue.project) {
    return;
  }

  return computed(() => {
    return {
      label: i18n.t('component.resource.detail.metadata.identifyingInformation.project'),
      value: resourceValue.project?.nameDisplay,
      to:    resourceValue.project?.detailLocation
    };
  });
};

export const useResourceDetails = (resource: any): undefined | ComputedRef<Row[]> => {
  const details = resource.details;

  if (!details) {
    return;
  }

  const extractValueOverride = (detail: any) => {
    if (!detail.formatter) {
      return;
    }

    return {
      component: detail.formatter,
      props:     {
        value: detail.content,
        ...detail.formatterOpts
      }
    };
  };

  return computed(() => {
    return details
      .filter((detail: any) => !detail.separator)
      .map((detail: any) => {
        return {
          label:         detail.label,
          value:         detail.content,
          valueOverride: extractValueOverride(detail)
        };
      });
  });
};
