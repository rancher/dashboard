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
    * Function resourceManagerFetchSecondaryResources
    * This method is used to fetch what is called "secondary resources", which can be defined as resources that are needed to populate
    * the page/component itself (ex: used as options on a Select) but don't need to be put into Vuex store or watched to get constant updates.
    * This method allows to fetch resources for a given namespace to reduce the amount of results instead of needing to fetch all and filtering afterwards.
    *
    *
    * @param {String} resourceData.namespace - Namespace identifier
    * @param {Object} resourceData.data - Object containing info about the data needed to be fetched and how it should be parsed. Note: The KEY NEEDS to be the resource TYPE!
    * @param {Array} resourceData.data[TYPE].applyTo - The array of operations needed to be performed for the specific data TYPE
    * @param {String} resourceData.data[TYPE].applyTo[x].var - The 'this' property name that should be populated with the data fetched
    * @param {Boolean} resourceData.data[TYPE].applyTo[x].classify - Whether the data fetched should have a model applied to it
    * @param {Function} resourceData.data[TYPE].applyTo[x].parsingFunc - Optional parsing function if the fetched data needs to be parsed
    */
    async resourceManagerFetchSecondaryResources(resourceData) {
      const requests = {};
      const namespace = resourceData.namespace;

      // Only fetch types if the user is allowed to...
      Object.keys(resourceData.data).forEach((type) => {
        const schema = this.$store.getters['cluster/schemaFor'](type);

        if (schema) {
          let url = schema.links.collection;

          if (schema?.attributes?.namespaced && namespace) {
            const parts = url.split('/');

            parts.splice(parts.length - 2, 0, `api`);
            parts.splice(parts.length - 1, 0, `namespaces/${ namespace }`);
            url = parts.join('/');
          }

          requests[type] = this.$store.dispatch('cluster/request', { url });
        }
      });

      if (Object.keys(requests).length) {
        // this is the flag/variable that we need to apply to all places that rely on this data. Ex: LabeledSelect
        this.isLoadingSecondaryResources = true;
        const hash = await allHashSettled(requests);
        const types = Object.keys(hash);

        for (let i = 0; i < types.length; i++) {
          const type = types[i];
          const status = hash[type].status;
          // if it's namespaced, we get the data on 'items' prop, for non-namespaced it's  'data' prop...
          const requestData = hash[type].value.items || hash[type].value.data || hash[type].value;

          if (status === 'fulfilled' && resourceData.data[type] && resourceData.data[type].applyTo?.length) {
            for (let y = 0; y < resourceData.data[type].applyTo.length; y++) {
              const apply = resourceData.data[type].applyTo[y];
              let resources = requestData;

              if (apply.classify) {
                // we need to add the type as a obj prop if it's not included... On PVC's in wasn't...
                if (!requestData[0]?.type) {
                  requestData.forEach((item, index) => {
                    requestData[index].type = type;
                  });
                }

                resources = await this.$store.dispatch('cluster/createMany', requestData);
              }

              if (apply.parsingFunc) {
                this[apply.var] = apply.parsingFunc(resources);
              } else {
                this[apply.var] = resources;
              }
            }
          } else if (status === 'rejected') {
            console.error(`Resource Manager - secondary data request for type ${ type } has failed`, status.error); // eslint-disable-line no-console
          }
        }

        this.isLoadingSecondaryResources = false;
      }
    },
  },
};
