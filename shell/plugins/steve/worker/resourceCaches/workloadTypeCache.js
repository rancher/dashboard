import ResourceCache from './resourceCache';
import { WORKLOAD_TYPES, POD } from '@shell/config/types';
import { matches } from '@shell/utils/selector';
import { CATTLE_PUBLIC_ENDPOINTS } from '@shell/config/labels-annotations';
import { get } from '@shell/utils/object';

export default class WorkloadType extends ResourceCache {
  constructor(schema, opt, workerMethods) {
    super(schema, opt, workerMethods);
    this.relatedTypes.push(POD);

    this._extraFields = [ // these are all fields that'll need to be deleted prior to sending back to the UI thread
      ...this._extraFields,
      {
        state: (workloadType) => {
          if ( workloadType.spec?.paused === true ) {
            return 'paused';
          }

          return workloadType.metadata?.state?.name || 'unknown';
        }
      },
      {
        pods: (workloadType) => {
          const [podRelationship] = (workloadType.metadata?.relationships || []).filter(relationship => relationship.toType === POD);

          if (podRelationship) {
            const pods = this._relatedTypeCaches[POD].asList;

            const thesePods = pods.filter((pod) => {
              return matches(pod, podRelationship.selector);
            });

            return thesePods;
          } else {
            return [];
          }
        }
      },
      { showPodRestarts: () => true }, // this is actually is just supposed to always return true
      {
        restartCount: (workloadType) => {
          const pods = workloadType.pods;
          let sum = 0;

          pods.forEach((pod) => {
            if (pod.status.containerStatuses) {
              sum += pod.status?.containerStatuses[0].restartCount || 0;
            }
          });

          return sum;
        }
      },
      {
        hasSidecars: (workloadType) => {
          const podTemplateSpec = workloadType.type === WORKLOAD_TYPES.CRON_JOB ? workloadType?.spec?.jobTemplate?.spec?.template?.spec : workloadType.spec?.template?.spec;

          const { containers = [], initContainers = [] } = podTemplateSpec;

          return containers.length > 1 || initContainers.length;
        }
      },
      { endpoint: workloadType => workloadType.metadata?.annotations[CATTLE_PUBLIC_ENDPOINTS] },
      { desired: workloadType => workloadType.spec?.replicas || 0 },
      { available: workloadType => workloadType.status?.readyReplicas || 0 },
      {
        ready: (workloadType) => {
          const readyReplicas = Math.max(0, (workloadType.status?.replicas || 0) - (workloadType.status?.unavailableReplicas || 0));

          if (workloadType.type === WORKLOAD_TYPES.DAEMON_SET) {
            return readyReplicas;
          }

          return `${ readyReplicas }/${ workloadType.desired }`;
        }
      },
      { unavailableReplicas: workloadType => workloadType.status?.unavailableReplicas || 0 },
      { upToDate: workloadType => workloadType.status?.updatedReplicas },
      // Jobs only count if the workloadType is a cronjob but it looks like it's expected as undefined on all workloadTypes
      {
        jobs: () => {
          return undefined;
        }
      },
      {
        showAsWorkload: (workloadType) => {
          const types = Object.values(WORKLOAD_TYPES);

          if (workloadType.metadata?.ownerReferences) {
            for (const owner of workloadType.metadata.ownerReferences) {
              const have = (`${ owner.apiVersion.replace(/\/.*/, '') }.${ owner.kind }`).toLowerCase();

              if ( types.includes(have) ) {
                return false;
              }
            }
          }

          return true;
        }
      },
      { isFromNorman: workloadType => (workloadType.metadata.labels || {})['cattle.io/creator'] === 'norman' },
      {
        podGauges: (workloadType) => {
          const out = { };

          if (!workloadType.pods) {
            return out;
          }

          workloadType.pods.map((pod) => {
            const { stateColor, stateDisplay } = pod;

            if (out[stateDisplay]) {
              out[stateDisplay].count++;
            } else {
              out[stateDisplay] = {
                color: stateColor.replace('text-', ''),
                count: 1
              };
            }
          });

          return out;
        }
      },
      {
        jobRelationships: (workloadType) => {
          if (workloadType.type !== WORKLOAD_TYPES.CRON_JOB) {
            return undefined;
          }

          return (get(workloadType, 'metadata.relationships') || []).filter(relationship => relationship.toType === WORKLOAD_TYPES.JOB);
        }
      },
      {
        jobGauges: (workloadType) => {
          const out = {
            succeeded: { color: 'success', count: 0 }, running: { color: 'info', count: 0 }, failed: { color: 'error', count: 0 }
          };

          if (workloadType.type === WORKLOAD_TYPES.CRON_JOB) {
            workloadType.jobs.forEach((job) => {
              const { status = {} } = job;

              out.running.count += status.active || 0;
              out.succeeded.count += status.succeeded || 0;
              out.failed.count += status.failed || 0;
            });
          } else if (workloadType.type === WORKLOAD_TYPES.JOB) {
            const { status = {} } = workloadType;

            out.running.count = status.active || 0;
            out.succeeded.count = status.succeeded || 0;
            out.failed.count = status.failed || 0;
          } else {
            return null;
          }

          return out;
        }
      }
    ];
  }
}
