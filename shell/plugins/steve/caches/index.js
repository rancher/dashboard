import DaemonSetCache from '@/shell/plugins/steve/caches/apps.daemonset';
import DeploymentCache from '@shell/plugins/steve/caches/apps.deployment';
import ReplicaSetCache from '@/shell/plugins/steve/caches/apps.replicaset';
import StatefulSetCache from '@/shell/plugins/steve/caches/apps.statefulset';
import CronJobCache from '@/shell/plugins/steve/caches/batch.cronjob';
import JobCache from '@/shell/plugins/steve/caches/batch.job';
import CatalogAppCache from '@shell/plugins/steve/caches/catalog.cattle.io.app';
import ClusterRepoCache from '@shell/plugins/steve/caches/catalog.cattle.io.clusterrepo';
import UIPluginCache from '@shell/plugins/steve/caches/catalog.cattle.io.uiplugin';
import CatalogCache from '@shell/plugins/steve/caches/catalog';
import ClusterScanBenchmarkCache from '@shell/plugins/steve/caches/cis.cattle.io.clusterscanbenchmark';
import CISProfileCache from '@shell/plugins/steve/caches/cis.cattle.io.clusterscanprofile';
import CISReportCache from '@shell/plugins/steve/caches/cis.cattle.io.clusterscanreport';
import CloudCredentialCache from '@shell/plugins/steve/caches/cloudcredential';
import ClusterCache from '@shell/plugins/steve/caches/cluster';
import CapiMachineDeploymentCache from '@shell/plugins/steve/caches/cluster.x-k8s.io.machinedeployment';
import ConfigMapCache from '@shell/plugins/steve/caches/configmap';
import CountsCache from '@shell/plugins/steve/caches/count';
import EtcDBackupCache from '@shell/plugins/steve/caches/etcdbackup';
import EventCache from '@shell/plugins/steve/caches/event';
import FleetClusterCache from '@shell/plugins/steve/caches/fleet.cattle.io.cluster';
import GroupCache from '@shell/plugins/steve/caches/group.principal';
import TranslationCache from '@shell/plugins/steve/caches/i18n';
import LogClusterFlowCache from '@shell/plugins/steve/caches/logging.banzaicloud.io.clusterflow';
import LogFlowCache from '@shell/plugins/steve/caches/logging.banzaicloud.io.flow';
import LogOutputCache from '@shell/plugins/steve/caches/logging.banzaicloud.io.output';
import AuthConfigCache from '@shell/plugins/steve/caches/management.cattle.io.authconfig';
import MgmtClusterCache from '@shell/plugins/steve/caches/management.cattle.io.cluster';
import CRTBCache from '@shell/plugins/steve/caches/management.cattle.io.clusterroletemplatebinding';
import FeatureCache from '@shell/plugins/steve/caches/management.cattle.io.feature';
import WorkspaceCache from '@shell/plugins/steve/caches/management.cattle.io.fleetworkspace';
import GlobalRoleCache from '@shell/plugins/steve/caches/management.cattle.io.globalrole';
import GRBCache from '@shell/plugins/steve/caches/management.cattle.io.globalrolebinding';
import MgmtNodePoolCache from '@shell/plugins/steve/caches/management.cattle.io.nodepool';
import NodeTemplateCache from '@shell/plugins/steve/caches/management.cattle.io.nodetemplate';
import ProjectCache from '@shell/plugins/steve/caches/management.cattle.io.project';
import PRTB from '@shell/plugins/steve/caches/management.cattle.io.projectroletemplatebinding';
import RoleTemplateCache from '@shell/plugins/steve/caches/management.cattle.io.roletemplate';
import User from '@shell/plugins/steve/caches/management.cattle.io.user';
import ManagementCache from '@shell/plugins/steve/caches/management';
import ReceiverCache from '@shell/plugins/steve/caches/monitoring.coreos.com.receiver';
import IngressCache from '@shell/plugins/steve/caches/networking.k8s.io.ingress';
import ClusterNode from '@shell/plugins/steve/caches/node';
import PVCache from '@shell/plugins/steve/caches/persistentvolume';
import PluginsCache from '@shell/plugins/steve/caches/plugins';
import PodCache from '@shell/plugins/steve/caches/pod';
import PrefsCache from '@shell/plugins/steve/caches/prefs';
import PrincipalCache from '@shell/plugins/steve/caches/principal';
import PRTBCache from '@shell/plugins/steve/caches/projectroletemplatebinding';
import ProvCluster from '@shell/plugins/steve/caches/provisioning.cattle.io.cluster';
import RancherCache from '@shell/plugins/steve/caches/rancher';
import ReplicationcontrollerCache from '@shell/plugins/steve/caches/replicationcontroller';
import ResourceCache from '@shell/plugins/steve/caches/resource-class';
import Backup from '@shell/plugins/steve/caches/resources.cattle.io.backup';
import Restore from '@shell/plugins/steve/caches/resources.cattle.io.restore';
import MachineTemplateCache from '@shell/plugins/steve/caches/rke-machine.cattle.io.machinetemplate';
import EtcdBackup from '@shell/plugins/steve/caches/rke.cattle.io.etcdsnapshot';
import RootCache from '@shell/plugins/steve/caches/root';
import SchemaCache from '@shell/plugins/steve/caches/schema';
import SecretCache from '@shell/plugins/steve/caches/secret';
import ServiceCache from '@shell/plugins/steve/caches/service';
import SteveDescriptionCache from '@shell/plugins/steve/caches/steve-description-class';
import StorageCacheClass from '@shell/plugins/steve/caches/storage.k8s.io.storageclass';
import TypeMapCache from '@shell/plugins/steve/caches/type-map';
import NavLinkCache from '@shell/plugins/steve/caches/ui.cattle.io.navlink';
import WorkloadCombinedCache from '@shell/plugins/steve/caches/workload.combined';

// TODO: RC note - calc fields are worked out within advanced worker (to paginate). resources without calc fields sent back to ui thread WITH list of resources required to re-calc calc fields
// - 20k pods sent over to work out page size's deployment's pods
// - need to ensure we still classify page... but keep calcs?

export default {
  'apps.daemonset':                                  DaemonSetCache,
  'apps.deployment':                                 DeploymentCache,
  'apps.replicaset':                                 ReplicaSetCache,
  'apps.statefulset':                                StatefulSetCache,
  'batch.cronjob':                                   CronJobCache,
  'batch.job':                                       JobCache,
  'catalog.cattle.io.app':                           CatalogAppCache,
  'catalog.cattle.io.clusterrepo':                   ClusterRepoCache,
  'catalog.cattle.io.uiplugin':                      UIPluginCache,
  catalog:                                           CatalogCache,
  'cis.cattle.io.clusterscanbenchmark':              ClusterScanBenchmarkCache,
  'cis.cattle.io.clusterscanprofile':                CISProfileCache,
  'cis.cattle.io.clusterscanreport':                 CISReportCache,
  cloudcredential:                                   CloudCredentialCache,
  cluster:                                           ClusterCache,
  'cluster.x-k8s.io.machinedeployment':              CapiMachineDeploymentCache,
  configmap:                                         ConfigMapCache,
  count:                                             CountsCache,
  etcdbackup:                                        EtcDBackupCache,
  event:                                             EventCache,
  'fleet.cattle.io.cluster':                         FleetClusterCache,
  'group.principal':                                 GroupCache,
  i18n:                                              TranslationCache,
  'logging.banzaicloud.io.clusterflow':              LogClusterFlowCache,
  'logging.banzaicloud.io.flow':                     LogFlowCache,
  'logging.banzaicloud.io.output':                   LogOutputCache,
  'management.cattle.io.authconfig':                 AuthConfigCache,
  'management.cattle.io.cluster':                    MgmtClusterCache,
  'management.cattle.io.clusterroletemplatebinding': CRTBCache,
  'management.cattle.io.feature':                    FeatureCache,
  'management.cattle.io.fleetworkspace':             WorkspaceCache,
  'management.cattle.io.globalrole':                 GlobalRoleCache,
  'management.cattle.io.globalrolebinding':          GRBCache,
  'management.cattle.io.nodepool':                   MgmtNodePoolCache,
  'management.cattle.io.nodetemplate':               NodeTemplateCache,
  'management.cattle.io.project':                    ProjectCache,
  'management.cattle.io.projectroletemplatebinding': PRTB,
  'management.cattle.io.roletemplate':               RoleTemplateCache,
  'management.cattle.io.user':                       User,
  management:                                        ManagementCache,
  'monitoring.coreos.com.receiver':                  ReceiverCache,
  'networking.k8s.io.ingress':                       IngressCache,
  node:                                              ClusterNode,
  persistentvolume:                                  PVCache,
  plugins:                                           PluginsCache,
  pod:                                               PodCache,
  prefs:                                             PrefsCache,
  principal:                                         PrincipalCache,
  projectroletemplatebinding:                        PRTBCache,
  'provisioning.cattle.io.cluster':                  ProvCluster,
  rancher:                                           RancherCache,
  replicationcontroller:                             ReplicationcontrollerCache,
  resourceCache:                                     ResourceCache,
  'resources.cattle.io.backup':                      Backup,
  'resources.cattle.io.restore':                     Restore,
  'rke-machine.cattle.io.machinetemplate':           MachineTemplateCache,
  'rke.cattle.io.etcdsnapshot':                      EtcdBackup,
  root:                                              RootCache,
  schema:                                            SchemaCache,
  secret:                                            SecretCache,
  service:                                           ServiceCache,
  'steve-description-class':                         SteveDescriptionCache,
  'storage.k8s.io.storageclass':                     StorageCacheClass,
  'type-map':                                        TypeMapCache,
  'ui.cattle.io.navlink':                            NavLinkCache,
  workload:                                          WorkloadCombinedCache,
};
