<script>
import { mapGetters } from 'vuex';
import { Card } from '@components/Card';
import SortableTable from '@shell/components/SortableTable';
import { exceptionToErrorsArray } from '@shell/utils/error';

export default {
  props: {
    resources: {
      type:     Array,
      required: true
    },
  },

  data() {
    return {
      loading: true, deleteTime: null, rows: [],
    };
  },
  async fetch() {
    const timestamp = new Date().getTime();
    const promiseAll = this.resources.map(({ metadata }) => {
      return this.getPods(metadata.name);
    });

    this.deleteTime = timestamp;

    const res = await this.getPodInfoList(promiseAll, timestamp);

    if (this.deleteTime !== res.timestamp) {
      return;
    }

    this.rows = res.pods;
    this.loading = false;
  },
  computed: {
    ...mapGetters(['currentCluster']),

    headers() {
      return [
        {
          name:     'subnet',
          label:    'Name',
          labelKey: 'tableHeaders.name',
          value:    'subnet',
        },
        {
          name:     'namespace',
          label:    'Namespace',
          labelKey: 'tableHeaders.namespace',
          value:    'namespace',
        },
        {
          name:     'podName',
          label:    'Workload',
          labelKey: 'macvlan.tableHeaders.workload',
          value:    'podName',
        },
        {
          name:     'ip',
          label:    'IP',
          labelKey: 'macvlan.tableHeaders.ip',
          value:    'ip',
        },
      ];
    },
  },
  methods: {
    removeMacvlans() {
      const resources = this.resources;
      const promises = [];

      for ( const resource of resources ) {
        try {
          promises.push(this.$store.dispatch('macvlan/removeMacvlan', { cluster: this.currentCluster.id, resource }));
        } catch (e) {
          this.errors = exceptionToErrorsArray(e);
        }
      }

      Promise.all(promises).then(() => {
        this.close();
      });
    },
    close() {
      this.$emit('close');
    },
    async getPodInfoList(promiseAll, timestamp) {
      return await Promise.all(promiseAll).then((results) => {
        return {
          pods: results,
          timestamp
        };
      });
    },
    displayMacvlanIp(labels = {}) {
      const type = labels['macvlan.panda.io/macvlanIpType'];
      const ip = labels['macvlan.pandaria.cattle.io/selectedIp'];

      return `${ ip || '' }${ type ? ` (${ type })` : '' }`;
    },
    async getPods(name) {
      let pods = await this.$store.dispatch('macvlan/loadMacvlanPods', {
        cluster: this.currentCluster.id,
        query:   {
          labelSelector: { 'macvlan.pandaria.cattle.io/subnet': name },
          limit:         -1,
        }
      });

      let more = false;
      let morePods = [];

      pods = Array.from(pods).filter(({ metadata }) => metadata && metadata.annotations && this.displayMacvlanIp(metadata.labels)
      ).map(({ metadata }) => {
        return {
          namespace: metadata.namespace,
          podName:   metadata.name,
          ip:        this.displayMacvlanIp(metadata.labels)
        };
      });

      if (pods.length > 5) {
        more = true;
        morePods = pods.splice(5, pods.length - 1);
      }

      return {
        subnet: name,
        pods,
        more,
        morePods,
      };
    },
    getNameRowSpen(row) {
      let count = 1;

      if (row.pods.length) {
        count = row.pods.length;
      }
      if (row.more) {
        ++count;
      }

      return count;
    },
    showMorePods(row) {
      this.$set(row, 'pods', row.pods.concat(row.morePods));
      this.$set(row, 'more', false);
    },
  },
  components: { Card, SortableTable }
};
</script>

<template>
  <div ref="macvlan">
    <Card
      class="macvlan"
      :show-highlight-border="false"
    >
      <h4
        slot="title"
        class="text-default-text"
      >
        {{ t('promptRemove.title') }}
      </h4>
      <div
        slot="body"
        class="pr-10 pl-10"
      >
        <SortableTable
          key-field="_key"
          :headers="headers"
          :rows="rows"
          :row-actions="false"
          :table-actions="false"
          :search="false"
          :loading="loading"
        >
          <template #main-row="{row}">
            <tr
              v-if="!row.pods.length"
              class="main-row"
            >
              <template v-for="(col) in headers">
                <td
                  :key="col.name"
                  :data-title="col.label"
                  :align="col.align || 'left'"
                  :width="col.width"
                  class="pl-5"
                >
                  {{ col.name === 'podName' ? t('macvlan.promptRemove.pod') : row[col.name] }}
                </td>
              </template>
            </tr>
            <tr
              v-for="(pod, i) in row.pods"
              :key="pod.name"
              class="main-row"
              :class="{ 'multi-pod': row.pods.length, 'border-bottom-none': i !== row.pods.length-1 || row.more}"
              :data-node-id="row.key"
            >
              <template v-for="(col, j) in headers">
                <td
                  v-if="j===0 && i === 0"
                  :key="col.name"
                  :data-title="col.label"
                  :data-testid="`sortable-cell-${ i }-${ j }`"
                  :align="col.align || 'left'"
                  :width="col.width"
                  :rowspan="getNameRowSpen(row)"
                >
                  {{ i===0 ? row[col.name] : '' }}
                </td>
                <td
                  v-if="j>0"
                  :key="col.name"
                  :data-title="col.label"
                  :data-testid="`sortable-cell-${ i }-${ j }`"
                  :align="col.align || 'left'"
                  :width="col.width"
                  class="pl-5"
                >
                  {{ pod[col.name] }}
                </td>
              </template>
            </tr>
            <tr
              v-if="row.more"
              class="main-row multi-pod"
              :data-node-id="row.key"
            >
              <td
                colspan="3"
                class="text-center"
                style="text-indent: -100px;"
              >
                <button
                  type="button"
                  class="btn btn-sm bg-primary role-line"
                  @click="showMorePods(row)"
                >
                  {{ t('macvlan.promptRemove.moreInfo', {count: row.morePods.length}) }}
                </button>
              </td>
            </tr>
          </template>
        </SortableTable>
      </div>

      <div
        slot="actions"
        class="bottom"
      >
        <div class="buttons">
          <button
            class="mr-10 btn role-secondary"
            @click="close()"
          >
            {{ t('generic.cancel') }}
          </button>
          <button
            class="btn role-primary"
            @click="removeMacvlans()"
          >
            {{ t('clusterConnectMode.actions.yes') }}
          </button>
        </div>
      </div>
    </Card>
  </div>
</template>

<style lang="scss" scoped>
.macvlan {
  margin: 0;
  .bottom {
      display: block;
      width: 100%;
  }
  .banner {
      margin-top: 0
  }
  .buttons {
      display: flex;
      justify-content: flex-end;
      width: 100%;
  }
  .border-bottom-none{
    border-bottom: none;
  }
  .multi-pod{
    td{
      padding: 3px 5px;
    }
    .role-line{
      background: transparent;
      color: var(--link)!important;
    }
  }
}
</style>
