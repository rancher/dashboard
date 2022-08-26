import { mapGetters } from 'vuex';
import { allHashSettled } from '@shell/utils/promise';

export default {
  computed: { ...mapGetters(['currentCluster']) },
  data() {
    return { isLoadingSecondaryResources: false };
  },
  methods:  {
    /**
    *
    * resourceData object structure
    *
    * @param {String} resourceData.namespace - Namespace identifier
    * @param {Object} resourceData.data - Object containing info about the data needed to be fetched and how it should be parsed. Note: The KEY NEEDS to be the resource TYPE!
    * @param {Array} resourceData.data[TYPE].applyTo - The array of operations needed to be performed for the specific data TYPE
    * @param {String} resourceData.data[TYPE].plural - String to override the default 's' plural used in resource requests, if needed
    * @param {String} resourceData.data[TYPE].applyTo[x].var - The 'this' property name that should be populated with the data fetched
    * @param {Function} resourceData.data[TYPE].applyTo[x].parsingFunc - Optional parsing function if the fetched data needs to be parsed
    */
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

          const requestPlural = resourceData.data[type].plural || 's';

          requests[type] = this.$store.dispatch('cluster/request', { url: `${ url }/${ type }${ requestPlural }` });
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
