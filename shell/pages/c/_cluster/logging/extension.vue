<script>
import { mapGetters } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ResourceFetch from '@shell/mixins/resource-fetch';
import {
  STATE, NAME as NAME_COL, NAMESPACE, TYPE, AGE
} from '@shell/config/table-headers';
import {
  WORKLOAD_TYPES, SCHEMA, NODE, POD, LIST_WORKLOAD_TYPES
} from '@shell/config/types';

const schema = {
  id:         'workload',
  type:       SCHEMA,
  attributes: {
    kind:       'Workload',
    namespaced: true
  },
  metadata: { name: 'workload' },
};

const worklaodTypes = ['CronJob', 'DaemonSet', 'Deployment', 'Job', 'StatefulSet'];

const $loadingResources = ($route, $store) => {
  const allowedResources = [];

  Object.values(LIST_WORKLOAD_TYPES).forEach((type) => {
    // You may not have RBAC to see some of the types
    if ($store.getters['cluster/schemaFor'](type) ) {
      allowedResources.push(type);
    }
  });

  const allTypes = $route.params.resource === schema.id;

  return {
    loadResources:     allTypes ? allowedResources : [$route.params.resource],
    loadIndeterminate: allTypes,
  };
};

export default {
  name:       'ListWorkload',
  components: { ResourceTable, LabeledSelect },
  mixins:     [ResourceFetch],

  props: {
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    if (this.allTypes && this.loadResources.length) {
      this.$initializeFetchData(this.loadResources[0], this.loadResources);
    } else {
      this.$initializeFetchData(this.$route.params.resource);
    }

    try {
      const schema = this.$store.getters[`cluster/schemaFor`](NODE);

      if (schema) {
        this.$fetchType(NODE);
      }
    } catch {}

    this.loadHeathResources();

    if ( this.allTypes ) {
      this.resources = await Promise.all(this.loadResources.map((allowed) => {
        return this.$fetchType(allowed, this.loadResources);
      }));
    } else {
      const type = this.$route.params.resource;

      if ( this.$store.getters['cluster/schemaFor'](type) ) {
        const resource = await this.$fetchType(type);

        this.resources = [resource];
      }
    }
  },

  data() {
    // Ensure these are set on load (to determine if the NS filter is required) rather than too late on `fetch`
    const { loadResources, loadIndeterminate } = $loadingResources(this.$route, this.$store);

    return {
      workloadType: '',
      resources:    [],
      loadResources,
      loadIndeterminate,
      headers:      [
        STATE, NAME_COL, TYPE, NAMESPACE, AGE
      ]
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    allTypes() {
      return this.$route.params.resource === schema.id;
    },
    workloadTypesChoices() {
      return worklaodTypes.reduce((prev, type) => {
        prev.push({
          label: type,
          value: type
        });

        return prev;
      }, [{
        label: this.t('logging.allWorkloadType.label'),
        value: ''
      }]);
    },

    schema() {
      const { params:{ resource:type } } = this.$route;

      if (type !== schema.id) {
        return this.$store.getters['cluster/schemaFor'](type);
      }

      return schema;
    },

    filteredRows() {
      const out = [];
      const t = this.t;

      for ( const typeRows of this.resources ) {
        if ( !typeRows ) {
          continue;
        }

        for ( const row of typeRows ) {
          if (row.kind === 'Pod' || row.kind === 'ReplicaSet') {
            continue;
          }

          if (this.workloadType && row.kind !== this.workloadType) {
            continue;
          }

          if (!this.allTypes || !row.ownedByWorkload) {
            const goToEdit = () => {
              const resources = row;

              resources.$dispatch('promptModal', {
                modalWidth:     '700px',
                resources,
                component:      'LoggingExtensionDialog',
                componentProps: {
                  workloadId:   resources.id,
                  workloadType: resources.type,
                },
              });
            };

            const availableActions = [{
              action:  'goToEdit',
              enabled: true,
              icon:    'icon icon-edit',
              label:   t('action.edit'),
            }];

            out.push({
              ...row,
              availableActions,
              stateBackground:   row.stateBackground,
              stateColor:        row.stateColor,
              state:             row.state,
              stateDisplay:      row.stateDisplay,
              nameDisplay:       row.nameDisplay,
              typeDisplay:       row.typeDisplay,
              namespace:         row.namespace,
              detailLocation:    row.detailLocation,
              stateDescription:  row.stateDescription,
              stateObj:          row.stateObj,
              creationTimestamp: row.creationTimestamp,
              groupByLabel:      row.groupByLabel,
              _key:              row._key,
              goToEdit,
            });
          }
        }
      }

      return out;
    },
  },

  // All of the resources that we will load that we need for the loading indicator
  $loadingResources($route, $store) {
    return $loadingResources($route, $store);
  },

  methods: {
    loadHeathResources() {
      // Fetch these in the background to populate workload health
      if ( this.allTypes ) {
        this.$fetchType(POD);
        this.$fetchType(WORKLOAD_TYPES.JOB);
      } else {
        const type = this.$route.params.resource;

        if (type === WORKLOAD_TYPES.JOB || type === POD) {
          // Ignore job and pods (we're fetching this anyway, plus they contain their own state)
          return;
        }

        if (type === WORKLOAD_TYPES.CRON_JOB) {
          this.$fetchType(WORKLOAD_TYPES.JOB);
        } else {
          this.$fetchType(POD);
        }
      }
    },

    changeRows(filterRows, searchLabels) {
      this.$set(this, 'filterRows', filterRows);
      this.$set(this, 'searchLabels', searchLabels);
    },
  },
};
</script>

<template>
  <div>
    <header>
      <div class="title">
        <h1 class="mb-0">
          Extension
        </h1>
      </div>
    </header>
    <ResourceTable
      :loading="$fetchState.pending"
      :schema="schema"
      :rows="filteredRows"
      :overflow-y="true"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
      :headers="headers"
      :table-actions="false"
    >
      <template #header-right>
        <LabeledSelect
          v-model="workloadType"
          class="workload-type-filter"
          :options="workloadTypesChoices"
          :multiple="false"
        />
      </template>
    </ResourceTable>
  </div>
</template>
<style lang="scss" scoped>
  .workload-type-filter {
    min-width: 180px;
    text-align: left;
  }
</style>
