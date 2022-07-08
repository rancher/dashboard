<script>
import { MODE_MAP, TRACE_HEADERS, OPERATION_MAP } from '../plugins/kubewarden/policy-class';
import { KUBEWARDEN } from '../types';
import { isEmpty } from '@shell/utils/object';

import { BadgeState } from '@components/BadgeState';
import { Banner } from '@components/Banner';
import SortableTable from '@shell/components/SortableTable';

export default {
  props: {
    rows: {
      type:     Array,
      default:  () => []
    }
  },

  components: {
    BadgeState, Banner, SortableTable
  },

  data() {
    return {
      MODE_MAP,
      TRACE_HEADERS,
      OPERATION_MAP
    };
  },

  computed: {
    groupField() {
      if ( !!this.isPolicyServer ) {
        return 'policy_id';
      }

      return null;
    },

    isPolicyServer() {
      return this.$route.params.resource === KUBEWARDEN.POLICY_SERVER;
    },

    noRows() {
      return isEmpty(this.rows);
    },

    rowsPerPage() {
      if ( !!this.isPolicyServer ) {
        return 100;
      }

      return 10;
    }
  },

  methods: {
    capitalizeMessage(m) {
      return m?.charAt(0).toUpperCase() + m?.slice(1);
    },

    modeColor(mode) {
      return this.MODE_MAP[mode];
    },

    opColor(op) {
      return this.OPERATION_MAP[op];
    },

    showLogs(logs) {
      if ( isEmpty(logs) ) {
        return false;
      }

      return true;
    }
  }
};
</script>

<template>
  <div>
    <Banner v-if="noRows" color="warning">
      <span v-if="isPolicyServer">No tracing data exists for the related policies.</span>
      <span v-else>No tracing data exists for this policy.</span>
    </Banner>

    <SortableTable
      v-else
      :rows="rows"
      :headers="TRACE_HEADERS"
      :group-by="groupField"
      :table-actions="false"
      :row-actions="false"
      key-field="traceID"
      default-sort-by="startTime"
      :sub-expandable="true"
      :sub-expand-column="true"
      :sub-rows="true"
      :paging="true"
      :rows-per-page="rowsPerPage"
    >
      <template #col:operation="{row}">
        <td>
          <BadgeState
            :label="row.operation"
            :color="opColor(row.operation)"
          />
        </td>
      </template>

      <template #col:mode="{row}">
        <td>
          <BadgeState
            :label="capitalizeMessage(row.mode)"
            :color="modeColor(row.mode)"
          />
        </td>
      </template>

      <template #sub-row="{row, fullColspan}">
        <td :colspan="fullColspan" class="sub-row">
          <div class="details">
            <template v-if="showLogs(row.logs)">
              <section class="col">
                <div class="title">
                  Response
                </div>
                <span v-if="row.logs.response" class="text-info">
                  {{ capitalizeMessage(row.logs.response) }}
                </span>
                <span v-else>
                  N/A
                </span>
              </section>
            </template>

            <template v-else>
              <section class="col">
                <div class="title">
                  Response Message
                </div>
                <span v-if="row.response_message" class="text-warning">
                  {{ capitalizeMessage(row.response_message) }}
                </span>
                <span v-else>
                  N/A
                </span>
              </section>
              <section class="col">
                <div class="title">
                  Response Code
                </div>
                <span class="text-info">
                  {{ row.response_code ? row.response_code : 'N/A' }}
                </span>
              </section>
              <section class="col">
                <div class="title">
                  Mutated
                </div>
                <span class="text-info">
                  {{ row.mutated }}
                </span>
              </section>
            </template>
          </div>
        </td>
      </template>
    </SortableTable>
  </div>
</template>

<style lang="scss" scoped>
.sub-row {
  background-color: var(--body-bg);
  border-bottom: 1px solid var(--sortable-table-top-divider);
  padding-left: 1rem;
  padding-right: 1rem;
}

.details {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 1em;

  .col {
    display: flex;
    flex-direction: column;

    section {
      margin-bottom: 1.5rem;
    }

    .title {
      color: var(--muted);
      margin-bottom: 0.5rem;
    }
  }
}
</style>
