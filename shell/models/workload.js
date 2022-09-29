import { findBy, insertAt } from '@shell/utils/array';
import { TIMESTAMP, CATTLE_PUBLIC_ENDPOINTS } from '@shell/config/labels-annotations';
import { WORKLOAD_TYPES, SERVICE, POD } from '@shell/config/types';
import { get, set } from '@shell/utils/object';
import day from 'dayjs';
import { convertSelectorObj, matching, matches } from '@shell/utils/selector';
import { SEPARATOR } from '@shell/components/DetailTop';
import WorkloadService from '@shell/models/workload.service';

export default class Workload extends WorkloadService {
  // remove clone as yaml/edit as yaml until API supported
  get _availableActions() {
    let out = super._availableActions;
    const type = this._type ? this._type : this.type;

    const editYaml = findBy(out, 'action', 'goToEditYaml');
    const index = editYaml ? out.indexOf(editYaml) : 0;

    insertAt(out, index, {
      action:  'addSidecar',
      label:   this.t('action.addSidecar'),
      icon:    'icon icon-plus',
      enabled: !!this.links.update,
    });

    if (type !== WORKLOAD_TYPES.JOB && type !== WORKLOAD_TYPES.CRON_JOB) {
      insertAt(out, 0, {
        action:  'toggleRollbackModal',
        label:   this.t('action.rollback'),
        icon:    'icon icon-history',
        enabled: !!this.links.update,
      });

      insertAt(out, 0, {
        action:     'redeploy',
        label:      this.t('action.redeploy'),
        icon:       'icon icon-refresh',
        enabled:    !!this.links.update,
        bulkable:   true,
      });

      insertAt(out, 0, {
        action:  'pause',
        label:   this.t('asyncButton.pause.action'),
        icon:    'icon icon-pause',
        enabled: !!this.links.update && !this.spec?.paused
      });

      insertAt(out, 0, {
        action:  'resume',
        label:   this.t('asyncButton.resume.action'),
        icon:    'icon icon-play',
        enabled: !!this.links.update && this.spec?.paused === true
      });
    }

    insertAt(out, 0, { divider: true }) ;

    insertAt(out, 0, {
      action:     'openShell',
      enabled:    !!this.links.view,
      icon:       'icon icon-fw icon-chevron-right',
      label:      this.t('action.openShell'),
      total:      1,
    });

    const toFilter = ['cloneYaml'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    return out;
  }

  applyDefaults(vm) {
    const { spec = {} } = this;

    if (this.type === WORKLOAD_TYPES.CRON_JOB) {
      if (!spec.jobTemplate) {
        spec.jobTemplate = {
          spec: {
            template: {
              spec: {
                restartPolicy: 'Never', containers: [{ imagePullPolicy: 'Always', name: 'container-0' }], initContainers: []
              }
            }
          }
        };
      }
    } else {
      if (!spec.replicas && spec.replicas !== 0) {
        spec.replicas = 1;
      }

      if (!spec.template) {
        spec.template = {
          spec: {
            restartPolicy: this.type === WORKLOAD_TYPES.JOB ? 'Never' : 'Always', containers: [{ imagePullPolicy: 'Always', name: 'container-0' }], initContainers: []
          }
        };
      }
      if (!spec.selector) {
        spec.selector = {};
      }
    }
    vm.$set(this, 'spec', spec);
  }

  toggleRollbackModal( resources = this ) {
    this.$dispatch('promptModal', {
      resources,
      component: 'RollbackWorkloadDialog'
    });
  }

  async rollBackWorkload( cluster, workload, rollbackRequestData ) {
    const rollbackRequestBody = JSON.stringify(rollbackRequestData);

    if ( Array.isArray( workload ) ) {
      throw new TypeError(this.t('promptRollback.multipleWorkloadError'));
    }
    const namespace = workload.metadata.namespace;
    const workloadName = workload.metadata.name;

    // Ensure we go out to the correct cluster
    await this.patch(rollbackRequestBody, { url: `/k8s/clusters/${ cluster.id }/apis/apps/v1/namespaces/${ namespace }/deployments/${ workloadName }` });
  }

  pause() {
    set(this.spec, 'paused', true);
    this.save();
  }

  resume() {
    set(this.spec, 'paused', false);
    this.save();
  }

  async scaleDown() {
    const newScale = this.spec.replicas - 1;

    if (newScale >= 0) {
      set(this.spec, 'replicas', newScale);
      await this.save();
    }
  }

  async scaleUp() {
    set(this.spec, 'replicas', this.spec.replicas + 1);
    await this.save();
  }

  get state() {
    if ( this.spec?.paused === true ) {
      return 'paused';
    }

    return super.state;
  }

  async openShell() {
    const pods = await this.matchingPods();

    for ( const pod of pods ) {
      if ( pod.isRunning ) {
        pod.openShell();

        return;
      }
    }

    this.$dispatch('growl/error', {
      title:   'Unavailable',
      message: 'There are no running pods to execute a shell in.'
    }, { root: true });
  }

  addSidecar() {
    return this.goToEdit({ sidecar: true });
  }

  get showPodRestarts() {
    return true;
  }

  get restartCount() {
    const pods = this.pods;

    let sum = 0;

    pods.forEach((pod) => {
      if (pod.status.containerStatuses) {
        sum += pod.status?.containerStatuses[0].restartCount || 0;
      }
    });

    return sum;
  }

  get hasSidecars() {
    const podTemplateSpec = this.type === WORKLOAD_TYPES.CRON_JOB ? this?.spec?.jobTemplate?.spec?.template?.spec : this.spec?.template?.spec;

    const { containers = [], initContainers = [] } = podTemplateSpec;

    return containers.length > 1 || initContainers.length;
  }

  get customValidationRules() {
    const type = this._type ? this._type : this.type;

    const podSpecPath = type === WORKLOAD_TYPES.CRON_JOB ? 'spec.jobTemplate.spec.template.spec' : 'spec.template.spec';
    const out = [
      {
        nullable:       false,
        path:           'metadata.name',
        required:       true,
        translationKey: 'generic.name',
        type:           'subDomain',
      },
      {
        nullable:       false,
        path:           'spec',
        required:       true,
        type:           'object',
        validators:     ['containerImages'],
      },
      {
        nullable:       true,
        path:           `${ podSpecPath }.affinity`,
        type:           'object',
        validators:     ['podAffinity'],
      }
    ];

    switch (type) {
    case WORKLOAD_TYPES.DEPLOYMENT:
    case WORKLOAD_TYPES.REPLICA_SET:
      out.push( {
        nullable:       false,
        path:           'spec.replicas',
        required:       true,
        type:           'number',
        translationKey: 'workload.replicas'
      });
      break;
    case WORKLOAD_TYPES.STATEFUL_SET:
      out.push({
        nullable:       false,
        path:           'spec.replicas',
        required:       true,
        type:           'number',
        translationKey: 'workload.replicas'
      });
      out.push({
        nullable:       false,
        path:           'spec.serviceName',
        required:       true,
        type:           'string',
        translationKey: 'workload.serviceName'
      });
      break;
    case WORKLOAD_TYPES.CRON_JOB:
      out.push( {
        nullable:       false,
        path:           'spec.schedule',
        required:       true,
        type:           'string',
        validators:     ['cronSchedule'],
        translationKey: 'workload.cronSchedule'
      });
    }

    return out;
  }

  get endpoint() {
    return this?.metadata?.annotations[CATTLE_PUBLIC_ENDPOINTS];
  }

  get desired() {
    return this.spec?.replicas || 0;
  }

  get available() {
    return this.status?.readyReplicas || 0;
  }

  get ready() {
    const readyReplicas = Math.max(0, (this.status?.replicas || 0) - (this.status?.unavailableReplicas || 0));

    if (this.type === WORKLOAD_TYPES.DAEMON_SET) {
      return readyReplicas;
    }

    return `${ readyReplicas }/${ this.desired }`;
  }

  get unavailable() {
    return this.status?.unavailableReplicas || 0;
  }

  get upToDate() {
    return this.status?.updatedReplicas;
  }

  get details() {
    const out = [];
    const type = this._type ? this._type : this.type;

    const detailItem = {
      endpoint:  {
        label:     'Endpoints',
        content:   this.endpoint,
        formatter: 'WorkloadDetailEndpoints'
      },
      ready:     {
        label:     'Ready',
        content:   this.ready
      },
      upToDate:  {
        label:     'Up-to-date',
        content:   this.upToDate
      },
      available: {
        label:     'Available',
        content:   this.available
      }
    };

    if (type === WORKLOAD_TYPES.JOB) {
      const { completionTime, startTime } = this.status;
      const FACTORS = [60, 60, 24];
      const LABELS = ['sec', 'min', 'hour', 'day'];

      if ( startTime ) {
        out.push({
          label:         'Started',
          content:       startTime,
          formatter:     'LiveDate',
          formatterOpts: { addSuffix: true },
        });
      }

      if (completionTime && startTime) {
        const end = day(completionTime);
        const start = day(startTime);
        let diff = end.diff(start) / 1000;

        let label;

        let i = 0;

        while ( diff >= FACTORS[i] && i < FACTORS.length ) {
          diff /= FACTORS[i];
          i++;
        }

        if ( diff < 5 ) {
          label = Math.floor(diff * 10) / 10;
        } else {
          label = Math.floor(diff);
        }

        label += ` ${ this.t(`unit.${ LABELS[i] }`, { count: label }) } `;
        label = label.trim();

        out.push({ label: 'Duration', content: label });
      }
    } else if ( type === WORKLOAD_TYPES.CRON_JOB ) {
      out.push({
        label:     'Last Scheduled Time',
        content:   this?.status?.lastScheduleTime,
        formatter: 'LiveDate'
      });
    }

    out.push( {
      label:     'Image',
      content:   this.imageNames,
      formatter: 'PodImages'
    });

    switch (type) {
    case WORKLOAD_TYPES.DEPLOYMENT:
      out.push(detailItem.ready, detailItem.upToDate, detailItem.available, SEPARATOR, detailItem.endpoint);
      break;
    case WORKLOAD_TYPES.DAEMON_SET:
      out.push(detailItem.ready, SEPARATOR, detailItem.endpoint);
      break;
    case WORKLOAD_TYPES.REPLICA_SET:
      out.push(detailItem.ready, SEPARATOR, detailItem.endpoint);
      break;
    case WORKLOAD_TYPES.STATEFUL_SET:
      out.push(detailItem.ready, SEPARATOR, detailItem.endpoint);
      break;
    case WORKLOAD_TYPES.REPLICATION_CONTROLLER:
      out.push(detailItem.ready, SEPARATOR, detailItem.endpoint);
      break;
    case WORKLOAD_TYPES.JOB:
      out.push(detailItem.endpoint);
      break;
    case WORKLOAD_TYPES.CRON_JOB:
      out.push(detailItem.endpoint);
      break;
    case WORKLOAD_TYPES.POD:
      out.push(detailItem.ready);
      break;
    default: break;
    }

    return out;
  }

  redeploy() {
    const now = (new Date()).toISOString().replace(/\.\d+Z$/, 'Z');

    if ( !this.spec.template.metadata ) {
      set(this.spec.template, 'metadata', {});
    }

    const annotations = this.spec.template.metadata.annotations || {};

    annotations[TIMESTAMP] = now;
    set(this.spec.template.metadata, 'annotations', annotations);

    this.save();
  }

  // match existing container ports with services created for this workload
  async getPortsWithServiceType() {
    const ports = [];

    this.containers.forEach(container => ports.push(...(container.ports || [])));
    (this.initContainers || []).forEach(container => ports.push(...(container.ports || [])));

    // Only get services owned if we can access the service resource
    const canAccessServices = this.$getters['schemaFor'](SERVICE);
    const services = canAccessServices ? await this.getServicesOwned() : [];
    const clusterIPServicePorts = [];
    const loadBalancerServicePorts = [];
    const nodePortServicePorts = [];

    if (services.length) {
      services.forEach((svc) => {
        switch (svc.spec.type) {
        case 'ClusterIP':
          clusterIPServicePorts.push(...(svc?.spec?.ports || []));
          break;
        case 'LoadBalancer':
          loadBalancerServicePorts.push(...(svc?.spec?.ports || []));
          break;
        case 'NodePort':
          nodePortServicePorts.push(...(svc?.spec?.ports || []));
          break;
        default:
          break;
        }
      });
    }
    ports.forEach((port) => {
      const name = port.name ? port.name : `${ port.containerPort }${ port.protocol.toLowerCase() }${ port.hostPort || port._listeningPort || '' }`;

      port.name = name;

      if (port._serviceType && port._serviceType !== '') {
        return;
      }

      if (loadBalancerServicePorts.length) {
        const portSpec = findBy(loadBalancerServicePorts, 'name', name);

        if (portSpec) {
          port._listeningPort = portSpec.port;

          port._serviceType = 'LoadBalancer';

          return;
        }
      } if (nodePortServicePorts.length) {
        const portSpec = findBy(nodePortServicePorts, 'name', name);

        if (portSpec) {
          port._listeningPort = portSpec.nodePort;

          port._serviceType = 'NodePort';

          return;
        }
      } if (clusterIPServicePorts.length) {
        if (findBy(clusterIPServicePorts, 'name', name)) {
          port._serviceType = 'ClusterIP';
        }
      }
    });

    return ports;
  }

  get showAsWorkload() {
    const types = Object.values(WORKLOAD_TYPES);

    if (this.metadata?.ownerReferences) {
      for (const owner of this.metadata.ownerReferences) {
        const have = (`${ owner.apiVersion.replace(/\/.*/, '') }.${ owner.kind }`).toLowerCase();

        if ( types.includes(have) ) {
          return false;
        }
      }
    }

    return true;
  }

  get isFromNorman() {
    return (this.metadata.labels || {})['cattle.io/creator'] === 'norman';
  }

  get warnDeletionMessage() {
    if (this.isFromNorman) {
      return this.t('workload.normanWarning');
    } else {
      return null;
    }
  }

  get pods() {
    const relationships = this.metadata?.relationships || [];
    const podRelationship = relationships.filter(relationship => relationship.toType === POD)[0];

    if (podRelationship) {
      const pods = this.$getters['podsByNamespace'](this.metadata.namespace);

      return pods.filter((obj) => {
        return matches(obj, podRelationship.selector);
      });
    } else {
      return [];
    }
  }

  get podGauges() {
    const out = { };

    if (!this.pods) {
      return out;
    }

    this.pods.map((pod) => {
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

  // Job Specific
  get jobRelationships() {
    if (this.type !== WORKLOAD_TYPES.CRON_JOB) {
      return undefined;
    }

    return (get(this, 'metadata.relationships') || []).filter(relationship => relationship.toType === WORKLOAD_TYPES.JOB);
  }

  get jobs() {
    if (this.type !== WORKLOAD_TYPES.CRON_JOB) {
      return undefined;
    }

    return this.jobRelationships.map((obj) => {
      return this.$getters['byId'](WORKLOAD_TYPES.JOB, obj.toId );
    }).filter(x => !!x);
  }

  get jobGauges() {
    const out = {
      succeeded: { color: 'success', count: 0 }, running: { color: 'info', count: 0 }, failed: { color: 'error', count: 0 }
    };

    if (this.type === WORKLOAD_TYPES.CRON_JOB) {
      this.jobs.forEach((job) => {
        const { status = {} } = job;

        out.running.count += status.active || 0;
        out.succeeded.count += status.succeeded || 0;
        out.failed.count += status.failed || 0;
      });
    } else if (this.type === WORKLOAD_TYPES.JOB) {
      const { status = {} } = this;

      out.running.count = status.active || 0;
      out.succeeded.count = status.succeeded || 0;
      out.failed.count = status.failed || 0;
    } else {
      return null;
    }

    return out;
  }

  async matchingPods() {
    const all = await this.$dispatch('findAll', { type: POD });
    const allInNamespace = all.filter(pod => pod.metadata.namespace === this.metadata.namespace);

    const selector = convertSelectorObj(this.spec.selector);

    return matching(allInNamespace, selector);
  }
}
