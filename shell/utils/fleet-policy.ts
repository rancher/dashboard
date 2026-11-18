import type { Store } from 'vuex';
import { FLEET } from '@shell/config/types';

interface PolicySource {
  defaultClientSecretName?: string;
  defaultHelmSecretName?: string;
}

interface Policy {
  metadata?: { name?: string, namespace?: string };
  gitRepo?: PolicySource;
  helmOp?: PolicySource;
}

interface GitRepoRestriction {
  metadata?: { name?: string, namespace?: string };
  defaultClientSecretName?: string;
}

export interface FleetPolicyDefaults {
  /** The credential a GitRepo is given when it names none itself. */
  clientSecretName: string;
  /** The credential a HelmOp is given when it names none itself. */
  helmSecretName: string;
}

const NONE: FleetPolicyDefaults = { clientSecretName: '', helmSecretName: '' };

const firstNonEmpty = (values: (string | undefined)[]): string => values.find((value) => !!value) || '';

const byName = <T extends { metadata?: { name?: string } }>(a: T, b: T) => (a.metadata?.name || '').localeCompare(b.metadata?.name || '');

const inNamespace = <T extends { metadata?: { namespace?: string } }>(resources: T[], namespace: string) => (resources || [])
  .filter((resource) => resource.metadata?.namespace === namespace);

async function findAllIfServed<T>(store: Store<any>, type: string): Promise<T[]> {
  return store.getters['management/schemaFor'](type) ? await store.dispatch('management/findAll', { type }) : [];
}

/**
 * The credentials the Policies in a workspace apply to an app bundle that names none itself.
 *
 * Fleet aggregates every Policy in the namespace, sorted by name, and the first non-empty default
 * wins, so a form filling a field in advance shows the value the controller would have applied.
 *
 * A GitRepo is also still subject to the deprecated GitRepoRestriction, whose own default outranks
 * the policies' for the credential it names. A HelmOp has no such counterpart.
 */
export async function getFleetPolicyDefaults(store: Store<any>, namespace?: string): Promise<FleetPolicyDefaults> {
  if (!namespace) {
    return NONE;
  }

  const [policies, restrictions] = await Promise.all([
    findAllIfServed<Policy>(store, FLEET.POLICY),
    findAllIfServed<GitRepoRestriction>(store, FLEET.GIT_REPO_RESTRICTION),
  ]);

  const workspacePolicies = inNamespace(policies, namespace).sort(byName);
  const workspaceRestrictions = inNamespace(restrictions, namespace).sort(byName);

  return {
    clientSecretName: firstNonEmpty([
      ...workspaceRestrictions.map((restriction) => restriction.defaultClientSecretName),
      ...workspacePolicies.map((policy) => policy.gitRepo?.defaultClientSecretName),
    ]),
    helmSecretName: firstNonEmpty(workspacePolicies.map((policy) => policy.helmOp?.defaultHelmSecretName)),
  };
}
