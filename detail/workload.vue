<script>
import { get } from '@/utils/object';
import { STATE, NAME, NODE, POD_IMAGES } from '@/config/table-headers';
import { POD, WORKLOAD } from '@/config/types';
import SortableTable from '@/components/SortableTable';
import DetailTop from '@/components/DetailTop';
import CRUWorkload from '@/edit/workload';
import Date from '@/components/formatter/Date';
import LoadDeps from '@/mixins/load-deps';
import { allHash } from '@/utils/promise';
import WorkloadPorts from '@/edit/workload/WorkloadPorts';

export default {
  name:       'DetailWorkload',
  components: {
    CRUWorkload,
    DetailTop,
    Date,
    SortableTable,
    WorkloadPorts,
  },
  mixins:     [LoadDeps],
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'view'
    }
  },

  data() {
    const podHeaders = [STATE, NAME, POD_IMAGES, NODE];

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
    let container;

    if (this.value.type === WORKLOAD.CRON_JOB) {
      // cronjob pod template is nested slightly different than other types
      const { spec: { jobTemplate: { spec: { template: { spec: { containers } } } } } } = this.value;

      container = containers[0];
    } else {
      const { spec:{ template:{ spec:{ containers } } } } = this.value;

      container = containers[0];
    }

    let name = this.value.id;

    if (get(this.value, 'metadata.namespace')) {
      name = name.slice(name.indexOf('/') + 1);
    }

    return {
      name,
      volumeHeaders,
      podHeaders,
      allPods:        [],
      allReplicasets: [],
      allJobs:        [],
      container
    };
  },
  computed:   {

    pods() {
      if (this.value.type === WORKLOAD.DEPLOYMENT) {
        const replicaset = this.filterResourcesByOwner(this.allReplicasets, this.name )[0];

        if (replicaset) {
          const replicaName = replicaset.id.slice(replicaset.id.indexOf('/') + 1);

          return this.filterResourcesByOwner(this.allPods, replicaName);
        }

        return [];
      } else if (this.value.type === WORKLOAD.CRON_JOB) {
        const job = this.filterResourcesByOwner(this.allJobs, this.name)[0];

        if (job) {
          const jobName = job.id.slice(job.id.indexOf('/') + 1);

          return this.filterResourcesByOwner(this.allPods, jobName);
        }

        return [];
      } else {
        return this.filterResourcesByOwner(this.allPods, this.name);
      }
    },

    podRestarts() {
      return this.pods.reduce((total, pod) => {
        const { status:{ containerStatuses = [] } } = pod;

        if (containerStatuses.length) {
          total += containerStatuses.reduce((tot, container) => {
            tot += container.restartCount;

            return tot;
          }, 0);
        }

        return total;
      }, 0);
    },

    detailTopColumns() {
      return [
        {
          title:   'Namespace',
          content: get(this.value, 'metadata.namespace')
        },
        {
          title:   'Image',
          content: this.container.image
        },
        {
          title:   'Type',
          content:  this.value._type ? this.value._type : this.value.type
        },
        {
          title:    'Config Scale',
          content:  get(this.value, 'spec.replicas'),
          fallback: 0

        },
        {
          title:    'Ready Scale',
          content:  get(this.value, 'status.readyReplicas'),
          fallback: 0
        },
        {
          title:    'Pod Restarts',
          content:  this.podRestarts,
          fallback: 0
        },
        {
          title:   'Created',
          name:  'created'
        },
      ];
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

  methods: {

    // filter a given list of resrouces by the ownerReference.name prop
    filterResourcesByOwner(resourceList, ownerId) {
      return resourceList.filter((resource) => {
        const { metadata:{ ownerReferences = [] } } = resource;

        return (ownerReferences.filter((owner) => {
          return owner.name === ownerId;
        }).length);
      });
    },

    // find all pods to filter by ownerRef
    // in case of deployment, pods are owned by related replicaset, so get replicasets
    // in case of cronjob, pods are owned by job
    async loadDeps() {
      if (this.value.type === WORKLOAD.DEPLOYMENT) {
        const hash = await allHash({
          replicasets: this.$store.dispatch('cluster/findAll', { type: WORKLOAD.REPLICA_SET }),
          pods:        this.$store.dispatch('cluster/findAll', { type: POD }),
        });

        this.allPods = hash.pods;
        this.allReplicasets = hash.replicasets;
      } else if (this.value.type === WORKLOAD.CRON_JOB) {
        const hash = await allHash({
          jobs: this.$store.dispatch('cluster/findAll', { type: WORKLOAD.JOB }),
          pods:        this.$store.dispatch('cluster/findAll', { type: POD }),
        });

        this.allPods = hash.pods;
        this.allJobs = hash.jobs;
      } else {
        const pods = await this.$store.dispatch('cluster/findAll', { type: POD });

        this.allPods = pods;
      }
    },
  },
};
</script>

<template>
  <CRUWorkload :value="value" :mode="mode">
    <template v-if="mode==='view'" #top>
      <DetailTop :columns="detailTopColumns">
        <template v-slot:created>
          <Date :value="value.metadata.creationTimestamp" />
        </template>
      </DetailTop>
      <div class="row mt-20">
        <WorkloadPorts :value="container.ports" mode="view" />
      </div>
      <div class="row mt-20">
        <div class="col span-12">
          <h3>
            Pods
          </h3>
          <SortableTable
            :rows="pods"
            :headers="podHeaders"
            key-field="id"
            :search="false"
            :table-actions="false"
          />
        </div>
      </div>
    </template>
  </CRUWorkload>
</template>
