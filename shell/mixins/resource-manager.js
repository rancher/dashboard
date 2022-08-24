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
          // const isNamespaced = schema?.attributes?.namespaced || false;
          // let url = `/k8s/clusters/${ clusterId }/api/v1/namespaces/${ namespace }`;

          // if (!isNamespaced) {
          //   url = `/k8s/clusters/${ clusterId }/v1`;
          // }

          const url = `/k8s/clusters/${ clusterId }/v1`;

          requests[type] = this.$store.dispatch('cluster/request', { url: `${ url }/${ type }s` });
        }
      });

      if (Object.keys(requests).length) {
        // this is the flag/variable that we need to apply to all places that rely on this data. Ex: LabeledSelect
        this.isLoadingSecondaryResources = true;
        const hash = await allHashSettled(requests);

        console.log('HASH!!!!', hash);

        // this.allSecrets = secrets.map(x => this.$store.dispatch(`cluster/create`, x)) || [];
        Object.keys(hash).forEach((type) => {
          const status = hash[type].status;
          // if it's namespaced, we get the data on 'items' prop, for non-namespaced it's  'data' prop...
          const requestData = hash[type].value.items ? hash[type].value.items : hash[type].value.data ? hash[type].value.data : hash[type].value;
          const classifiedData = [];

          // it's an array, let's apply the class for each item...
          if (hash[type].value.items || hash[type].value.data) {
            const promises = [];

            requestData.forEach((item) => {
              promises.push(this.$store.dispatch(`cluster/create`, item));
            });

            Promise.allSettled(promises).then((res) => {
              res.forEach((item) => {
                if (item.status === 'fulfilled' && item.value) {
                  console.log('item', item.value);
                  classifiedData.push(Object.assign({}, item.value));
                }
              });
            });
          }

          if (status === 'fulfilled' && resourceData.data[type] && resourceData.data[type].applyTo?.length) {
            const dataToUse = classifiedData.length ? classifiedData : requestData;

            console.log('dataToUse', type, dataToUse);

            resourceData.data[type].applyTo.forEach((apply) => {
              if (apply.parsingFunc) {
                this[apply.var] = apply.parsingFunc(dataToUse);
              } else {
                this[apply.var] = dataToUse;
              }
            });
          }
        });

        this.isLoadingSecondaryResources = false;
      }
    },
  },
};
