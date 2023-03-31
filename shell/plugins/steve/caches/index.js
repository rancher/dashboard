import SchemaCache from '@shell/plugins/steve/caches/schema';
import ResourceCache from '@shell/plugins/steve/caches/resource-class';
import CountsCache from '@shell/plugins/steve/caches/count';
import DeploymentCache from '@shell/plugins/steve/caches/apps.deployment';
import PodCache from '@shell/plugins/steve/caches/pod';
import TypeMapCache from '@shell/plugins/steve/caches/type-map';
import TranslationCache from '@shell/plugins/steve/caches/i18n';
import DaemonSetCache from '@/shell/plugins/steve/caches/apps.daemonset';
import StatefulSetCache from '@/shell/plugins/steve/caches/apps.statefulset';
import ReplicaSetCache from '@/shell/plugins/steve/caches/apps.replicaset';
import ReplicationcontrollerCache from '@/shell/plugins/steve/caches/replicationcontroller';
import CronJobCache from '@/shell/plugins/steve/caches/batch.cronjob';
import JobCache from '@/shell/plugins/steve/caches/batch.job';
import WorkloadCombinedCache from '@shell/plugins/steve/caches/workload.combined';

export default {
  schema:                SchemaCache,
  resourceCache:         ResourceCache,
  count:                 CountsCache,
  pod:                   PodCache,
  'apps.deployment':     DeploymentCache,
  'type-map':            TypeMapCache,
  i18n:                  TranslationCache,
  'apps.daemonset':      DaemonSetCache,
  'apps.statefulset':    StatefulSetCache,
  'apps.replicaset':     ReplicaSetCache,
  replicationcontroller: ReplicationcontrollerCache,
  'batch.cronjob':       CronJobCache,
  'batch.job':           JobCache,
  workload:              WorkloadCombinedCache
};
