import { Store } from 'vuex';
import { PersonasApi } from '@shell/apis/intf/shell';
import { AUTHORIZATION, CUSTOMIZATION } from '@shell/config/types';
import Persona, { PERSONA_API_GROUP } from '@shell/models/customization.ui.rancher.persona';
import SelfSubjectRulesReview from '@shell/models/authorization.k8s.io.selfsubjectrulesreview';

/**
 * Shell implementation of the `PersonasApi`
 */
export class PersonasApiImpl implements PersonasApi {
  private store: Store<any>;
  private assignedNames?: Promise<string[]>;

  constructor(store: Store<any>) {
    this.store = store;
  }

  public async currentUsersPersonas(): Promise<Persona[]> {
    const [personas, assignedNames] = await Promise.all([this.findPersonas(), this.assignedPersonaNames()]);

    return personas.filter((persona) => assignedNames.includes(persona.metadata.name));
  }

  public refreshCurrentUsersPersonas(): Promise<Persona[]> {
    this.reset();

    return this.currentUsersPersonas();
  }

  /**
   * Forget the personas assigned to the user, so the next request fetches them. Called on log out
   */
  public reset() {
    delete this.assignedNames;
  }

  private async findPersonas(): Promise<Persona[]> {
    try {
      return await this.store.dispatch('management/findAll', { type: CUSTOMIZATION.PERSONA });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Unable to list personas, the current user is treated as having none', e);

      return [];
    }
  }

  /**
   * The names of the personas assigned to the user, by an admin binding them (or a group they're in) to the persona's global role
   */
  private assignedPersonaNames(): Promise<string[]> {
    if (!this.assignedNames) {
      this.assignedNames = this.fetchAssignedPersonaNames();
    }

    return this.assignedNames;
  }

  private async fetchAssignedPersonaNames(): Promise<string[]> {
    try {
      // The review needs a namespace. Global role rules are cluster wide, so they're returned for any
      const review: SelfSubjectRulesReview = await this.store.dispatch('management/create', {
        type: AUTHORIZATION.SELF_SUBJECT_RULES_REVIEW,
        spec: { namespace: 'default' },
      });

      await review.save();

      // Only explicit rules count, wildcards (e.g. an admin's) don't assign a persona
      const names = (review.status?.resourceRules || [])
        .filter((rule) => rule.verbs?.includes('assume') && rule.apiGroups?.includes(PERSONA_API_GROUP) && rule.resources?.includes('personas'))
        .flatMap((rule) => rule.resourceNames || []);

      return [...new Set(names)];
    } catch (e) {
      // Don't keep the failure, the next request tries again
      delete this.assignedNames;

      // eslint-disable-next-line no-console
      console.warn('Unable to find the personas assigned to the current user', e);

      return [];
    }
  }
}
