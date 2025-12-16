<script lang="ts">
import { BadgeState } from '@components/BadgeState';
import { AGE } from '@shell/config/table-headers';
import { Banner } from '@components/Banner';
import { AuditPolicy } from '@shell/edit/auditlog.cattle.io.auditpolicy/types';
import ResourceFetch from '@shell/mixins/resource-fetch';
import ResourceTable from '@shell/components/ResourceTable.vue';

// Extended type for UI state
interface ErrorInfo {
  message: string,
  timestamp: number,
}

interface AuditPolicyRow {
  id: string;
  _error?: ErrorInfo;
  spec: AuditPolicy;
  metadata: {
    name: string;
  };
  status: {
    conditions?: Array<{
      type: string;
      status: string;
      reason: string;
    }>;
  };
}

export default {
  components: {
    BadgeState, Banner, ResourceTable
  },
  mixins: [ResourceFetch],
  props:  {
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
    }
  },

  async fetch() {
    await this.$fetchType(this.resource);
  },

  computed: {
    headers() {
      const headersFromSchema = this.$store.getters['type-map/headersFor'](this.schema);

      const headers = headersFromSchema.filter((h: {name : string}) => h.name !== 'valid' && h.name !== 'active');

      headers.push(AGE);

      return headers;
    },
    errorList() {
      return this.rows.map((row: AuditPolicyRow) => {
        if (row._error) {
          return {
            message: `Policy "${ row.metadata.name }": ${ row._error.message }`, row, timestamp: row._error.timestamp
          };
        }

        return null;
      }).filter((err: ErrorInfo | null) => !!err).sort((err: ErrorInfo) => err.timestamp);
    },
    errorMessages() {
      return this.errorList.map((err: {message: string}) => err.message);
    },
  },

  // "PolicyNotYetActivated"
  // "PolicyIsActive"
  // "PolicyIsInvalid"
  // "PolicyWasDisabled"
  methods: {
    removeError(idx: number) {
      delete this.errorList[idx].row._error;
    }
  }

};
</script>

<template>
  <div>
    <Banner
      v-for="(err, idx) in errorMessages"
      :key="idx"
      color="error"
      :stacked="true"
      :closable="true"
      @close="() => removeError(idx)"
    >
      {{ err }}
    </Banner>
    <ResourceTable
      :schema="schema"
      :headers="headers"
      :rows="rows"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :namespaced="schema.attributes.namespaced"
      fetchSecondaryResources="fetchSecondaryResources"
    >
      <template #cell:enabled="{row}">
        <BadgeState
          :color="row.spec.enabled ? 'bg-success' : 'badge-disabled'"
          :label="row.spec.enabled ? t('auditPolicy.enabled') : t('auditPolicy.disabled') "
        />
      </template>
    </ResourceTable>
  </div>
</template>
