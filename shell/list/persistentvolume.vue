<script lang="ts">
import { defineComponent } from 'vue';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { PVC } from '@shell/config/types';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import { FilterArgs, PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { PagTableFetchPageSecondaryResourcesOpts, PagTableFetchSecondaryResourcesOpts, PagTableFetchSecondaryResourcesReturns } from '@shell/types/components/paginatedResourceTable';
import { K8S } from '@shell/apis';

export default defineComponent({
  name: 'ListPersistentVolume',

  components: { PaginatedResourceTable },

  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    },

    overflowX: {
      type:    Boolean,
      default: false
    },

    overflowY: {
      type:    Boolean,
      default: false
    },
  },

  data() {
    return {
      newPv:              undefined as any,
      createInstanceData: {
        // apiVersion: 'v1',
        // kind:     'PersistentVolume',
        type:     K8S.PV,
        metadata: {
          name:        'alex-pv-test',
          annotations: {},
          labels:      {},
        },
        spec: {
          accessModes:          ['ReadWriteOnce'],
          awsElasticBlockStore: {
            partition: 0,
            readOnly:  false,
            volumeID:  'aws-dummy-volume-uuid',
          },
          capacity:         { storage: '10Gi' },
          storageClassName: '',
        }
      },
      badData: {
        type: 'pod',
        spec: { template: {} }
      }
    };
  },

  methods: {
    /**
     * of type PagTableFetchSecondaryResources
     */
    async fetchSecondaryResources({ canPaginate }: PagTableFetchSecondaryResourcesOpts): PagTableFetchSecondaryResourcesReturns {
      if (canPaginate) {
        return;
      }

      return this.$store.dispatch(`cluster/findAll`, { type: PVC });
    },

    /**
     * PV columns need other resources in order to show data in some columns
     *
     * So when we have a page.... use those entries as filters when fetching the other resources
     */
    async fetchPageSecondaryResources({ canPaginate, force, page }: PagTableFetchPageSecondaryResourcesOpts) {
      if (!page?.length) {
        return;
      }

      const opt: ActionFindPageArgs = {
        force,
        pagination: new FilterArgs({
          filters: PaginationParamFilter.createMultipleFields(page.map((r: any) => new PaginationFilterField({
            field: 'spec.volumeName',
            value: r.metadata.name
          }))),
        })
      };

      return this.$store.dispatch(`cluster/findPage`, { type: PVC, opt });
    },
    async createNewInstance() {
      // const data = await this.$resources.cluster.create(this.createInstanceData);
      const data = await this.$resources.cluster.create(this.badData);

      this.newPv = data;

      console.error('Created new instance:', data); // eslint-disable-line no-console
    },
    async patchInstance() {
      const newData = { spec: { capacity: { storage: '111Gi' } } };
      const data = await this.$resources.cluster.patch(K8S.PV, this.newPv.id, newData);

      console.error('PATCH instance via RESOURCES API:', data); // eslint-disable-line no-console
    },
    async updateInstance() {
      // doesn't work because of the non-enumerable _model property on ResourceInstanceImpl, which causes structuredClone to throw a DataCloneError
      // const newData = structuredClone(this.newPv);
      const newData = structuredClone(this.newPv.toJSON());
      // or simply
      // const newData = JSON.parse(JSON.stringify(this.newPv));

      newData.spec.capacity.storage = '1222Gi';
      const data = await this.$resources.cluster.update(K8S.PV, this.newPv.id, newData);

      console.error('UPDATE instance via RESOURCES API:', data); // eslint-disable-line no-console
    },
    async deleteInstance() {
      await this.$resources.cluster.delete(K8S.PV, this.newPv.id);
    },
    async patchInstanceApi() {
      const newData = { spec: { capacity: { storage: '11Gi' } } };
      const data = await this.newPv.patch(newData);

      console.error('Patched instance via Instance API:', data); // eslint-disable-line no-console
    },
    async updateInstanceApi() {
      console.error('this.newPv before update:', this.newPv); // eslint-disable-line no-console
      this.newPv.spec.capacity.storage = '12Gi';
      const data = await this.newPv.update();

      console.error('Updated instance via Instance API:', data); // eslint-disable-line no-console
    },
    async deleteInstanceApi() {
      console.error('this.newPv before delete:', this.newPv); // eslint-disable-line no-console
      await this.newPv.delete();
    }
  }
});
</script>

<template>
  <button
    class="btn role-primary"
    @click="createNewInstance"
  >
    CREATE
  </button>
  <button
    class="btn role-secondary"
    @click="patchInstance"
  >
    PATCH
  </button>
  <button
    class="btn role-secondary"
    @click="updateInstance"
  >
    UPDATE
  </button>
  <button
    class="btn role-secondary"
    @click="deleteInstance"
  >
    DELETE
  </button>
  <button
    class="btn role-primary"
    @click="patchInstanceApi"
  >
    PATCH INSTANCE API
  </button>
  <button
    class="btn role-primary"
    @click="updateInstanceApi"
  >
    UPDATE INSTANCE API
  </button>
  <button
    class="btn role-primary"
    @click="deleteInstanceApi"
  >
    DELETE INSTANCE API
  </button>
  <PaginatedResourceTable
    :schema="schema"
    :fetchSecondaryResources="fetchSecondaryResources"
    :fetchPageSecondaryResources="fetchPageSecondaryResources"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"

    :overflow-x="overflowX"
    :overflow-y="overflowY"
  />
</template>
