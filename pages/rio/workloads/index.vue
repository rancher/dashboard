<script>
import ResourceTable from '@/components/ResourceTable';
import BadgeState from '@/components/formatters/BadgeState';
import Random from '@/components/Random';
import { allHash } from '@/utils/promise';
import { get } from '@/utils/object';

import { RIO } from '@/utils/types';
import {
  STATE, NAMESPACE_NAME, SCALE, CREATED, SUCCESS, REQ_RATE, P95
} from '@/utils/table-headers';

const RESOURCE = RIO.APP;

export default {
  components: {
    ResourceTable, BadgeState, Random
  },

  computed: {
    schema() {
      return this.$store.getters['cluster/schemaFor'](RESOURCE);
    },

    headers() {
      const out = [
        STATE,
        NAMESPACE_NAME,
        SCALE,
        SUCCESS,
        REQ_RATE,
        P95,
        CREATED,
      ];

      return out;
    }
  },

  async asyncData(ctx) {
    const hash = await allHash({
      rows:     ctx.store.dispatch('cluster/findAll', { type: RESOURCE }),
      versions: ctx.store.dispatch('cluster/findAll', { type: RIO.VERSION }),
    });

    return {
      resource: RESOURCE,
      rows:     hash.rows
    };
  },

  methods: { get },
};
</script>

<template>
  <div>
    <header>
      <h1>Workloads</h1>
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
      <template #cell:success>
        <Random :min="10" :max="100" suffix="%" />
      </template>
      <template #cell:req-rate>
        <Random :min="1" :max="20" :decimals="1" suffix="/s" />
      </template>
      <template #cell:p95>
        <Random :min="50" :max="500" suffix="ms" />
      </template>
      <template #sub-row="scope">
        <tr v-for="version in scope.row.spec.revisions" :key="version.serviceName">
          <td colspan="2"></td>
          <td><BadgeState val="ignored" :col="scope.col" :row="scope.row" /></td>
          <td>{{ version.serviceName }}</td>
          <td align="center">
            {{ get(scope.row.weights, version.Version) || 0 }}%
            <div
              v-if="version.adjustedWeight !== undefined && version.adjustedWeight !== get(scope.row.weights, version.Version)"
              class="text-small text-muted"
            >
              to {{ version.adjustedWeight }}%
            </div>
          </td>
          <td align="right">
            <Random :min="10" :max="100" suffix="%" />
          </td>
          <td align="right">
            <Random :min="1" :max="20" :decimals="1" suffix="/s" />
          </td>
          <td align="right">
            <Random :min="50" :max="500" suffix="ms" />
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
