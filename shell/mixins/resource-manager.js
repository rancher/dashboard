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
    * @param {String} resourceData.data[TYPE].applyTo[x].var - The 'this' property name that should be populated with the data fetched
    * @param {Function} resourceData.data[TYPE].applyTo[x].parsingFunc - Optional parsing function if the fetched data needs to be parsed
    */
    async resourceManagerFetchSecondaryResources(resourceData) {
      const requests = {};
      const clusterId = this.currentCluster.id;
      const namespace = resourceData.namespace;

      // Only fetch types if the user can see them
      Object.keys(resourceData.data).forEach((type) => {
        const schema = this.$store.getters['cluster/schemaFor'](type);

        if (schema) {
          let url;
          const isNamespaced = schema?.attributes?.namespaced || false;
          const resourceTypePlural = schema?.pluralName;

          if (isNamespaced && namespace) {
            url = `/k8s/clusters/${ clusterId }/api/v1/namespaces/${ namespace }/${ resourceTypePlural }`;
          } else {
            url = `/k8s/clusters/${ clusterId }/v1/${ resourceTypePlural }`;
          }

          requests[type] = this.$store.dispatch('cluster/request', { url });
        }
      });

      if (Object.keys(requests).length) {
        // this is the flag/variable that we need to apply to all places that rely on this data. Ex: LabeledSelect
        this.isLoadingSecondaryResources = true;
        const hash = await allHashSettled(requests);

        Object.keys(hash).forEach((type) => {
          const status = hash[type].status;
          // if it's namespaced, we get the data on 'items' prop, for non-namespaced it's  'data' prop...
          const requestData = hash[type].value.items || hash[type].value.data || hash[type].value;

          if (status === 'fulfilled' && resourceData.data[type] && resourceData.data[type].applyTo?.length) {
            resourceData.data[type].applyTo.forEach((apply) => {
              if (apply.parsingFunc) {
                this[apply.var] = apply.parsingFunc(requestData);
              } else {
                this[apply.var] = requestData;
              }
            });
          } else if (status === 'rejected') {
            console.error(`Resource Manager - secondary data request for type ${ type } has failed`, status.error); // eslint-disable-line no-console
          }
        });

        this.isLoadingSecondaryResources = false;
      }
    },
  },
};
