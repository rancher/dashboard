import SteveModel from '@shell/plugins/steve/steve-class';
import { RBAC, SECRET, SERVICE_ACCOUNT } from '@shell/config/types';
import { findAllOf, findIfExists, relatedEntry, workloadsInNamespace } from '@shell/utils/editable-related-resources';

export default class ServiceAccount extends SteveModel {
  /**
   * The resources related to this ServiceAccount, to edit by YAML alongside it
   *
   * Dependencies: the Secrets it lists in `secrets` and `imagePullSecrets`
   *
   * Dependents:
   * - the workloads in its namespace whose pods run as it
   * - the RoleBindings and ClusterRoleBindings naming it as a subject, from every namespace, as a
   *   RoleBinding can bind a ServiceAccount of another namespace
   *
   * See https://kubernetes.io/docs/reference/access-authn-authz/rbac/
   *
   * @param {import('@shell/core/types').EditableRelatedResourcesFetchOptions} [options]
   * @returns {Promise<import('@shell/core/types').EditableRelatedResource[]>}
   */
  async fetchOwnEditableRelatedResources({ dependencies = true, dependents = true } = {}) {
    if (!this.metadata?.uid) {
      return [];
    }

    const namespace = this.metadata.namespace;
    const name = this.metadata.name;
    const secretNames = [...new Set([...this.secrets || [], ...this.imagePullSecrets || []].map((ref) => ref?.name).filter(Boolean))];

    const [secrets, workloads, roleBindings, clusterRoleBindings] = await Promise.all([
      dependencies ? Promise.all(secretNames.map((secretName) => findIfExists(this, SECRET, `${ namespace }/${ secretName }`))) : [],
      dependents ? workloadsInNamespace(this, namespace) : [],
      dependents ? findAllOf(this, RBAC.ROLE_BINDING) : [],
      dependents ? findAllOf(this, RBAC.CLUSTER_ROLE_BINDING) : [],
    ]);

    const bindsThis = (binding) => (binding.subjects || []).some((subject) => subject?.kind === 'ServiceAccount' &&
      subject.name === name &&
      // the rbac authorizer reads a ServiceAccount subject with no namespace as one in the binding's namespace
      (subject.namespace || binding.metadata?.namespace) === namespace
    );

    return [
      ...secrets.filter(Boolean).map((secret) => relatedEntry(secret)),
      ...[
        ...workloads.filter((workload) => workload.usesResource(SERVICE_ACCOUNT, name)),
        ...roleBindings.filter(bindsThis),
        ...clusterRoleBindings.filter(bindsThis),
      ].map((resource) => relatedEntry(resource, { dependent: true })),
    ];
  }
}
