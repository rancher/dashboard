<script>
import { get } from '@/utils/object';
import { POD, EVENT } from '@/config/types';
import ResourceTable from '@/components/ResourceTable';
import {
  STATE, NAME, AGE, POD_IMAGES, NODE,
} from '@/config/table-headers';
import { sortBy } from '@/utils/sort';
import LiveDate from '@/components/formatter/LiveDate';
import DetailTop from '@/components/DetailTop';
export default {
  components: {
    ResourceTable, LiveDate, DetailTop
  },

  props:      {
    value: {
      type:     Object,
      required: true,
    },
  },
  data() {
    return {
      pods:         [],
      events:       [],
      eventColumns:  [
        {
          name:      'type',
          label:     'Type',
          value:     '_type',
          width: '100px'
        },
        {
          name:  'reason',
          label: 'Reason',
          value: 'reason',
          width: '200px'
        },
        {
          name:  'message',
          label: 'Message',
          value: 'message'
        },
        {
          name:      'time',
          label:     'Time',
          value:     'firstTimestamp',
          formatter: 'LiveDate'
        }
      ],
      eventSort: { column: 'eventTime', desc: true }
    };
  },
  computed: {
    table() {
      const schema = this.$store.getters['cluster/schemaFor'](POD);

      return {
        label:   'Pods',
        schema,
        headers: [STATE, NAME, POD_IMAGES, NODE, AGE],
        rows:    this.pods
      };
    },
    namespace() {
      return get(this.value, 'metadata.namespace');
    },
    version() {
      return get(this.value, 'status.computedVersion');
    },
    creationTimestamp() {
      const date = new Date(get(this.value, 'metadata.creationTimestamp'));

      return `${ date.getMonth() + 1 }/${ date.getDate() }/${ date.getUTCFullYear() }`;
    },
    endpoints() {
      return get(this.value, 'status.endpoints') || [];
    },
    ports() {
      return get(this.value, 'spec.ports') || [];
    },
  },
  mounted() {
    this.findPods();
  },
  methods: {
    yesno(bool) {
      return bool ? 'yes' : 'no';
    },
    sortEvents(column ) {
      const desc = !this.eventSort.desc;

      this.events = sortBy(this.events, column, desc );
      this.eventSort = { column, desc: !this.eventSort.desc };
    },
    async findPods() {
      const name = this.value.metadata.name;

      const all = await this.$store.dispatch('cluster/findAll', { type: POD });
      const relevant = all.filter((pod) => {
        const labels = get(pod, 'metadata.labels');

        if (labels) {
          const relevant = Object.values(labels).some(string => string === name);
          const podVersion = labels.version;

          if (relevant && (podVersion === this.version || !podVersion)) {
            return relevant;
          }
        }

        const annotations = get(pod, 'metadata.annotations');

        if (annotations) {
          const relevant = Object.values(annotations).some(string => string === name);

          if (relevant) {
            return relevant;
          }
        }

        return false;
      });

      this.pods = relevant;
      this.findEvents();
    },
    async findEvents() {
      const all = await this.$store.dispatch('cluster/findAll', { type: EVENT });

      const podNames = this.pods.map(pod => get(pod, 'metadata.name'));
      const relevant = all.filter((event) => {
        const eventPodName = get(event, 'involvedObject.name');

        return podNames.includes(eventPodName);
      });

      this.events = relevant;
    },
    rowClick(e) {
      window.alert(e);
    }
  }
};
</script>

<template>
  <div class="service-detail">
    <div>
      <h4>Pods</h4>
      <ResourceTable
        :schema="table.schema"
        :rows="table.rows"
        :headers="table.headers"
        :groupable="false"
      />
    </div>
    <div class="row">
      <div class="col span-6">
        <h4>Endpoints</h4>
        <table class="flat">
          <thead>
            <tr>
              <th>url</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="endpoint in endpoints" :key="endpoint">
              <td>
                <a :href="endpoint">{{ endpoint }}</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="col span-6>">
        <h4>Ports</h4>
        <table class="flat">
          <thead>
            <tr>
              <th :width="eventColumns[0].width">
                Listening Port
              </th>
              <th :width="eventColumns[1].width">
                Protocol
              </th>
              <th>Target Port</th>
              <th width="75px">
                Exposed
              </th>
              <th width="75px">
                Host Port
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="port in ports" :key="port.name">
              <td>{{ port.port }}</td>
              <td>{{ port.protocol }}</td>
              <td>{{ port.targetPort }}</td>
              <td>{{ yesno(port.expose ? port.expose : true) }}</td>
              <td>{{ yesno(!!port.hostPort) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div>
      <h4>Events</h4>
      <div>
        <table class="flat">
          <thead>
            <tr>
              <th v-for="col in eventColumns" :key="col.name" :width="col.width">
                {{ col.label }}
                <span class="icon-stack" @click="e=>sortEvents(col.value)">
                  <i class="icon icon-sort icon-stack-1x faded" />
                  <i v-if="eventSort.column === col.value && eventSort.desc" class="icon icon-sort-down icon-stack-1x" />
                  <i v-if="eventSort.column === col.value && !eventSort.desc" class="icon icon-sort-up icon-stack-1x" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in events" :key="event.eventTime" class="click-row">
              <td v-for="col in eventColumns" :key="col.name + '--row'">
                <a :href="event.metadata.selfLink" target="_blank">
                  <template v-if="!!col.formatter">
                    <component :is="col.formatter" :value="event[col.value]" /> ago
                  </template>
                  <span v-else> {{ event[col.value] }}</span>
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style lang='scss'>

  .service-detail {
    & > * {
      margin: 10px 0 10px 0;
    }
    & h4{
      margin: 20px 20px 20px 0
    }
    &  .sortable-table-header {
      display: none;
    }
  }
  .flat {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
    & th{
      padding-bottom: 1rem;
      text-align: left;
      font-weight: normal;
      color: var(--secondary);
    }

    & :not(THEAD) tr{
      border-bottom: 1px solid var(--border);

      & td {
        padding: 10px 0 10px 0;
      }
    }
    & tr td:last-child, th:last-child{
      text-align: right;
    }

    & tr td:first-child, th:first-child{
      text-align: left;
      margin-left: 15px;
    }

    & .click-row a{
      color: var(--input-text);
    }

    & .click-row:hover{
      @extend .faded;
    }

    & .faded {
      opacity: 0.3
    }
  }
</style>
