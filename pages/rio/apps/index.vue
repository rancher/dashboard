<script>
import ResourceTable from '@/components/ResourceTable';
import BadgeState from '@/components/formatters/BadgeState';

import { RIO } from '@/utils/types';
import {
  STATE, NAME, NAMESPACE, WEIGHT, SCALE, CREATED, SUCCESS, REQ_RATE, P95
} from '@/utils/table-headers';

const RESOURCE = RIO.APP;

export default {
  components: { ResourceTable, BadgeState },

  computed: {
    schema() {
      return this.$store.getters['v1/schemaFor'](RESOURCE);
    },

    headers() {
      const out = [
        STATE,
        NAME,
        NAMESPACE,
        WEIGHT,
        SCALE,
        SUCCESS,
        REQ_RATE,
        P95,
        CREATED,
      ];

      return out;
    }
  },

  asyncData(ctx) {
    return Promise.all([
      ctx.store.dispatch('v1/findAll', { type: RESOURCE }),
      ctx.store.dispatch('v1/findAll', { type: RIO.VERSION }),
    ]).then(([apps, versions]) => {
      return {
        resource: RESOURCE,
        rows:     apps
      };
    });
  },
};
</script>

<template>
  <div>
    <header>
      <h1>Apps &amp; Versions</h1>
      <div class="actions">
        <nuxt-link to="create" append tag="button" type="button" class="btn bg-primary">
          Deploy
        </nuxt-link>
      </div>
    </header>

    <ResourceTable
      :schema="schema"
      :headers="headers"
      :rows="rows"
      :sub-rows="true"
      :sub-expandable="true"
    >
      <template #cell:scale="scope">
        {{ scope.row.totalScale || '?' }}
      </template>
      <template #sub-row="scope">
        <tr v-for="version in scope.row.spec.revisions" :key="version.serviceName">
          <td colspan="2"></td>
          <td><BadgeState :row="scope.row" /></td>
          <td>{{ version.serviceName }}</td>
          <td align="center">
            {{ scope.row.status.revisionWeight[version.Version].weight }}%
            <div
              v-if="version.adjustedWeight != scope.row.status.revisionWeight[version.Version].weight"
              class="text-small text-muted"
            >
              to {{ version.adjustedWeight }}%
            </div>
          </td>
          <td align="center">
            {{ version.scale }}
          </td>
          <td align="right">
            100%
          </td>
          <td align="right">
            5rps
          </td>
          <td align="right">
            200ms
          </td>
          <td align="right">
            ?
          </td>
          <td></td>
        </tr>
      </template>
    </ResourceTable>
  </div>
</template>
