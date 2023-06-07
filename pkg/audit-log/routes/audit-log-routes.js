import GlobalAuditLog from '../pages/GlobalAuditLog.vue';
import ClusterAuditLog from '../pages/ClusterAuditLog.vue';
import ProjectAuditLog from '../pages/ProjectAuditLog.vue';
import K8sAuditLog from '../pages/K8sAuditLog.vue';

const routes = [
  {
    name:      'c-cluster-manager-globalAuditLog',
    path:      `/c/:cluster/:product/global-audit-log`,
    component: GlobalAuditLog,
  },
  {
    name:      'c-cluster-auditLog',
    path:      `/c/:cluster/:product/cluster-audit-log`,
    component: ClusterAuditLog,
  },
  {
    name:      'c-project-auditLog',
    path:      `/c/:cluster/:product/project-audit-log`,
    component: ProjectAuditLog,
  },
  {
    name:      'c-cluster-manager-k8sAuditLog',
    path:      `/c/:cluster/manager/k8s-audit-log`,
    component: K8sAuditLog,
  }
];

export default routes;
