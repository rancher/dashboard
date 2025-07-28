import { useI18n } from '@shell/composables/useI18n';
import { computed, Ref, toValue } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

type ResourceType = string | Ref<string>;
type IdType = string | Ref<string>;

export const useResourceIdentifiers = (type: ResourceType) => {
  const route = useRoute();
  const store = useStore();

  const typeValue = toValue(type);

  const id = computed(() => route.params.namespace ? `${ route.params.namespace }/${ route.params.id }` : `${ route.params.id }`);
  const schema = computed(() => store.getters['cluster/schemaFor'](typeValue));
  const clusterId = computed(() => route.params.cluster as string);

  return {
    clusterId: clusterId.value, id: id.value, schema: schema.value
  };
};

export const useFetchResourceWithId = async(type: ResourceType, id: IdType, inStore = 'cluster') => {
  const store = useStore();
  const i18n = useI18n(store);

  const typeValue = toValue(type);
  const idValue = toValue(id);

  try {
    return await store.dispatch(`${ inStore }/find`, { type: typeValue, id: idValue });
  } catch (ex: any) {
    if (ex.status === 404 || ex.status === 403) {
      store.dispatch('loadingError', new Error(i18n.t('nav.failWhale.resourceIdNotFound', { resource: type, fqid: id }, true)));
    }
  }
};
