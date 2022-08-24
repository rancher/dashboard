import { mapGetters } from 'vuex';
import { allHashSettled } from '@shell/utils/promise';

export default {
  computed: { ...mapGetters(['currentCluster']) },
  methods:  {
    async $resourceManagerFetchSecondaryResources(resourceData) {
      const requests = {};
      const clusterId = this.currentCluster.id;
      const namespace = resourceData.namespace;

      // Only fetch types if the user can see them
      Object.keys(resourceData.data).forEach((type) => {
        const schema = this.$store.getters['cluster/schemaFor'](type);

        if (schema) {
          const isNamespaced = schema?.attributes?.namespaced || false;
          let url = `/k8s/clusters/${ clusterId }/api/v1/namespaces/${ namespace }`;

          if (!isNamespaced) {
            url = `/k8s/clusters/${ clusterId }/v1`;
          }

          requests[type] = this.$store.dispatch('cluster/request', { url: `${ url }/${ type }s` });
        }
      });

      if (Object.keys(requests).length) {
        // this is the flag/variable that we need to apply to all places that rely on this data. Ex: LabeledSelect
        this.isLoadingSecondaryResources = true;
        const hash = await allHashSettled(requests);

        Object.keys(hash).forEach((type) => {
          const status = hash[type].status;
          // if it's namespaced, we get the data on 'items' prop, for non-namespaced it's  'data' prop...
          const requestData = hash[type].value.items ? hash[type].value.items : hash[type].value.data ? hash[type].value.data : hash[type].value;

          if (status === 'fulfilled' && resourceData.data[type] && resourceData.data[type].applyTo?.length) {
            resourceData.data[type].applyTo.forEach((apply) => {
              if (apply.parsingFunc) {
                this[apply.var] = apply.parsingFunc(requestData);
              } else {
                this[apply.var] = requestData;
              }
            });
          }
        });

        this.isLoadingSecondaryResources = false;
      }
    },
  },
};
