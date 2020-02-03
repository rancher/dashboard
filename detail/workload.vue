<script>
import { get } from '@/utils/object';
import { STATE, NAME, IMAGE, NODE } from '@/config/table-headers';
import { POD } from '@/config/types';
import SortableTable from '@/components/SortableTable';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import KVTable from '@/components/KVTable';

export default {
  components: {
    SortableTable,
    Tabbed,
    Tab,
    KVTable
  },
  props:      {
    id: {
      type:     String,
      required: true
    },
    namespace: {
      type:     String,
      required: true
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    const podHeaders = [STATE, NAME, IMAGE, NODE];

    const volumeHeaders = [
      {
        name:      'volumeName',
        label:     'Name',
        value:     'name',
      },
      {
        name:  'mountPath',
        label: 'Mount Path',
        value: '$.mountPaths[0]'
      },
      {
        name:  'secret',
        label: 'Secret',
        value: 'secret.secretName'
      }
    ];

    return {
      volumeHeaders, podHeaders, pods:  []
    };
  },
  computed:   {

    labels() {
      const { labels = {} } = this.value;

      return labels;
    },

    annotations() {
      const { workloadAnnotations = {} } = this.value;

      return workloadAnnotations;
    },

    podTemplateSpec() {
      return get(this.value, 'spec.template.spec') || {};
    },

    volumes() {
      let { volumes = [] } = this.podTemplateSpec;
      const { containers = [] } = this.podTemplateSpec;
      const map = {};

      volumes.forEach((volume) => {
        map[volume.name] = { ...volume, mountPaths: [] };
      });

      containers.forEach((container) => {
        const { volumeMounts = [] } = container;

        volumeMounts.forEach((volumeMount) => {
          map[volumeMount.name].mountPaths.push(volumeMount.mountPath);
        });
      });

      volumes = [];
      for (const key in map) {
        volumes.push({ name: key, ...map[key] });
      }

      return volumes;
    }
  },
  mounted() {
    this.findPods(this.id, this.namespace);
  },
  methods: {
    async findPods(id, ns) {
      const pods = await this.$store.dispatch('cluster/findAll', { type: POD }).then((pods) => {
        return pods.filter((pod) => {
          const { metadata:{ ownerReferences = [], namespace } } = pod;

          return (ownerReferences.filter((owner) => {
            return owner.name === id;
          }).length && namespace === ns);
        });
      });

      this.pods = pods;
    },
  }
};
</script>

<template>
  <div>
    <div v-if="pods.length" class="mt-20">
      <h4>Pods</h4>
      <SortableTable :rows="pods" :search="false" :table-actions="false" :headers="podHeaders" :key-field="id" />
    </div>
    <div class="row mt-20">
      <Tabbed default-tab="Labels">
        <Tab name="labels" label="Labels">
          <h4>Labels</h4>
          <KVTable :rows="labels" class="mb-20" />

          <h4>Annotations</h4>
          <KVTable :rows="annotations" />
        </Tab>
        <Tab name="volumes" label="Volumes">
          <SortableTable
            :rows="volumes"
            :headers="volumeHeaders"
            key-field="name"
            :search="false"
            :table-actions="false"
            :row-actions="false"
          />
        </Tab>
        <Tab name="variables" label="Variables">
        </Tab>
      </Tabbed>
    </div>
  </div>
</template>
