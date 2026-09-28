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

export interface FleetPolicyDefaults {
  /** The credential a GitRepo is given when it names none itself. */
  clientSecretName: string;
  /** The credential a HelmOp is given when it names none itself. */
  helmSecretName: string;
}

const NONE: FleetPolicyDefaults = { clientSecretName: '', helmSecretName: '' };

const firstNonEmpty = (values: (string | undefined)[]): string => values.find((value) => !!value) || '';

/**
 * The credentials the Policies in a workspace apply to an app bundle that names none itself.
 *
 * Fleet aggregates every Policy in the namespace, sorted by name, and the first non-empty default
 * wins, so a form filling a field in advance shows the value the controller would have applied.
 */
export async function getFleetPolicyDefaults(store: Store<any>, namespace?: string): Promise<FleetPolicyDefaults> {
  if (!namespace || !store.getters['management/schemaFor'](FLEET.POLICY)) {
    return NONE;
  }

  const policies: Policy[] = await store.dispatch('management/findAll', { type: FLEET.POLICY });

  const inWorkspace = (policies || [])
    .filter((policy) => policy.metadata?.namespace === namespace)
    .sort((a, b) => (a.metadata?.name || '').localeCompare(b.metadata?.name || ''));

  return {
    clientSecretName: firstNonEmpty(inWorkspace.map((policy) => policy.gitRepo?.defaultClientSecretName)),
    helmSecretName:   firstNonEmpty(inWorkspace.map((policy) => policy.helmOp?.defaultHelmSecretName)),
  };
}
