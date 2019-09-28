<script>
import ResourceTable from '@/components/ResourceTable';
import BadgeState from '@/components/formatters/BadgeState';
import Random from '@/components/Random';
import DiscreteProgressBar from '@/components/DiscreteProgressBar';
import TableSparkLine from '@/components/TableSparkLine';
import { allHash } from '@/utils/promise';
import { get } from '@/utils/object';

import { RIO } from '@/config/types';
import {
  STATE, NAMESPACE_NAME, SCALE, CREATED, SUCCESS, REQ_RATE, P95
} from '~/config/table-headers';

const RESOURCE = RIO.APP;

export default {
  components: {
    ResourceTable, BadgeState, Random, DiscreteProgressBar, TableSparkLine
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
        <Random :min="10" :max="100" :suffix="`%`">
          <template v-slot:default="graph">
            <DiscreteProgressBar :progress="graph.data" :interval="graph.interval" />
          </template>
        </Random>
      </template>
      <template #cell:req-rate>
        <Random :min="1" :max="20" :decimals="1" :suffix="`/s`">
          <template v-slot:default="graph">
            <TableSparkLine :input-datum="graph.data" :max="graph.max" />
          </template>
        </Random>
      </template>
      <template #cell:p95>
        <Random :min="50" :max="500" :suffix="`ms`">
          <template v-slot="graph">
            <TableSparkLine :input-datum="graph.data" />
          </template>
        </Random>
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
            <Random :min="10" :max="100" :interval="3000" :suffix="`%`">
              <template v-slot:default="graph">
                <DiscreteProgressBar :progress="graph.data" :interval="graph.interval" />
              </template>
            </Random>
          </td>
          <td align="right">
            <Random :min="1" :max="20" :decimals="1" :suffix="`/s`">
              <template v-slot:default="graph">
                <TableSparkLine :input-datum="graph.data" :max="graph.max" />
              </template>
            </random>
          </td>
          <td align="right">
            <Random :min="50" :max="500" :interval="1000" :suffix="`ms`">
              <template v-slot="graph">
                <TableSparkLine :input-datum="graph.data" />
              </template>
            </Random>
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
