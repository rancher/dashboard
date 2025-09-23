import { useI18n } from '@shell/composables/useI18n';
import {
  computed, ComputedRef, defineAsyncComponent, markRaw, toValue
} from 'vue';
import Additional from '@shell/components/Resource/Detail/Additional.vue';
import { useStore } from 'vuex';
import {
  NAMESPACE, FLEET, SERVICE_ACCOUNT, SECRET, CAPI,
  MANAGEMENT
} from '@shell/config/types';
import { Row } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/index.vue';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet';
import { useRoute } from 'vue-router';
import { TYPES as SECRET_TYPES } from '@shell/models/secret';
import { KUBERNETES } from '@shell/config/labels-annotations';

export const useNamespace = (resource: any): ComputedRef<Row> | undefined => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  if (!resourceValue.namespace || resourceValue.namespaces || resourceValue.isProjectScoped) {
    return;
  }

  return computed(() => {
    return {
      label:           i18n.t('component.resource.detail.metadata.identifyingInformation.namespace'),
      value:           resourceValue.namespace,
      valueDataTestid: 'masthead-subheader-namespace',
      valueOverride:   {
        component: markRaw(defineAsyncComponent(() => import('@shell/components/Resource/Detail/ResourcePopover/index.vue'))),
        props:     {
          type:           NAMESPACE,
          id:             resourceValue.namespace,
          detailLocation: resourceValue.namespaceLocation
        }
      }
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

export const useProject = (resource: any): ComputedRef<Row> | undefined => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  // Only show project if one of these types
  if (resource.type !== NAMESPACE && resource.type !== SECRET) {
    return;
  }

  if (!resourceValue.project) {
    return;
  }

  return computed(() => {
    return {
      label:           i18n.t('component.resource.detail.metadata.identifyingInformation.project'),
      value:           resourceValue.project?.nameDisplay,
      valueDataTestid: 'masthead-subheader-project',
      valueOverride:   {
        component: markRaw(defineAsyncComponent(() => import('@shell/components/Resource/Detail/ResourcePopover/index.vue'))),
        props:     {
          type:         MANAGEMENT.PROJECT,
          id:           resourceValue.project?.id,
          currentStore: 'management'
        }
      }
    };
  });
};

export const useSecretCluster = (resource: any): ComputedRef<Row> | undefined => {
  const store = useStore();
  const resourceValue = toValue(resource);

  return computed(() => {
    return {
      label: store.getters['type-map/labelFor']({ id: CAPI.RANCHER_CLUSTER }),
      value: resourceValue.projectCluster?.nameDisplay,
    };
  });
};

export const useResourceDetails = (resource: any): undefined | ComputedRef<Row[]> => {
  const details = computed(() => resource.details);

  if (!details.value) {
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
    return details.value
      .filter((detail: any) => !detail.separator && detail.content !== undefined && detail.content !== null)
      .map((detail: any) => {
        return {
          label:         detail.label,
          value:         detail.content,
          valueOverride: extractValueOverride(detail)
        };
      });
  });
};

export const useImage = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label:         i18n.t('component.resource.detail.metadata.identifyingInformation.image'),
    value:         resourceValue.imageNames,
    valueOverride: {
      component: markRaw(Additional),
      props:     { items: resourceValue.imageNames }
    },
  }));
};

export const useReady = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label: i18n.t('component.resource.detail.metadata.identifyingInformation.ready'),
    value: resourceValue.ready,
  }));
};

export const useSecretType = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);

  const resourceValue = toValue(resource);

  return computed(() => {
    return {
      label: i18n.t('component.resource.detail.metadata.identifyingInformation.type'),
      value: resourceValue.typeDisplay,
    };
  });
};

export const useServiceAccount = (resource: any): undefined | ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);

  const resourceValue = toValue(resource);

  if (resourceValue._type !== SECRET_TYPES.SERVICE_ACCT) {
    return;
  }

  const serviceAccountName = resourceValue.metadata?.annotations?.[KUBERNETES.SERVICE_ACCOUNT_NAME];

  if (!serviceAccountName) {
    return;
  }

  return computed(() => {
    return {
      label: i18n.t('component.resource.detail.metadata.identifyingInformation.serviceAccount'),
      value: serviceAccountName,
      to:    {
        name:   `c-cluster-product-resource-namespace-id`,
        params: {
          product:   store.getters['productId'],
          cluster:   store.getters['clusterId'],
          namespace: resource.namespace,
          resource:  SERVICE_ACCOUNT,
          id:        serviceAccountName
        }
      }
    };
  });
};

export const useCertificate = (resource: any): undefined | ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);

  const resourceValue = toValue(resource);

  if (!resourceValue.cn) {
    return;
  }

  const certificate = resourceValue.plusMoreNames ? `${ resourceValue.cn } ${ i18n.t('secret.certificate.plusMore', { n: resourceValue.plusMoreNames }) }` : resourceValue.cn;

  return computed(() => {
    return {
      label: i18n.t('component.resource.detail.metadata.identifyingInformation.certificate'),
      value: certificate,
    };
  });
};

export const useIssuer = (resource: any): undefined | ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);

  const resourceValue = toValue(resource);

  if (!resourceValue.issuer) {
    return;
  }

  return computed(() => {
    return {
      label: i18n.t('component.resource.detail.metadata.identifyingInformation.issuer'),
      value: resourceValue.issuer,
    };
  });
};

export const useExpires = (resource: any): undefined | ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);

  const resourceValue = toValue(resource);

  if (!resourceValue.notAfter) {
    return;
  }

  return computed(() => {
    return {
      label:         i18n.t('component.resource.detail.metadata.identifyingInformation.expires'),
      valueOverride: {
        component: markRaw(Date),
        props:     {
          value: resourceValue.notAfter,
          class: resourceValue.dateClass
        }
      },
      value: resourceValue.notAfter,
    };
  });
};
