/**
 * A Kubernetes RBAC rule, as found in roles, global roles, role templates and access reviews. Every field is optional, a rule being edited may not have them all yet
 */
export interface PolicyRule {
  apiGroups?: string[];
  resources?: string[];
  verbs?: string[];
  resourceNames?: string[];
  nonResourceURLs?: string[];
}
