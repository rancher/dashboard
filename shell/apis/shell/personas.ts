import { Store } from 'vuex';
import { PersonasApi } from '@shell/apis/intf/shell';
import { AUTHORIZATION, CUSTOMIZATION, SCHEMA } from '@shell/config/types';
import Persona, { PERSONA_API_GROUP } from '@shell/models/customization.ui.rancher.persona';
import SelfSubjectRulesReview from '@shell/models/authorization.k8s.io.selfsubjectrulesreview';
import { PolicyRule } from '@shell/types/resources/rbac';
import { Schema } from '@shell/plugins/steve/schema';
import { STORE } from '@shell/store/store-types';

/**
 * Maps each RBAC verb in a persona rule to the HTTP method that shows the user has it, and which of the schema's method lists holds it.
 *
 * Steve fills a schema's `resourceMethods` (a single resource) and `collectionMethods` (the type's collection) from the signed in user's
 * own access, in any namespace. So, for example, a user who can create deployments has `POST` in the deployment schema's
 * `collectionMethods`, and one who can delete them has `DELETE` in its `resourceMethods`
 */
const VERB_METHODS: Record<string, { methods: 'resourceMethods' | 'collectionMethods', method: string }> = {
  get:    { methods: 'resourceMethods', method: 'GET' },
  list:   { methods: 'collectionMethods', method: 'GET' },
  // Steve has no method for watch, Rancher's roles grant it with list
  watch:  { methods: 'collectionMethods', method: 'GET' },
  create: { methods: 'collectionMethods', method: 'POST' },
  update: { methods: 'resourceMethods', method: 'PUT' },
  patch:  { methods: 'resourceMethods', method: 'PATCH' },
  delete: { methods: 'resourceMethods', method: 'DELETE' },
};

const ANY = '*';

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

    return personas.filter((persona) => assignedNames.includes(persona.metadata.name) || this.isAssociated(persona));
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

  /**
   * Is the persona associated with the user via resource permissions: do they have the rights in any one of its rules
   */
  private isAssociated(persona: Persona): boolean {
    return (persona.spec?.rules || []).some((rule) => this.hasRule(rule));
  }

  /**
   * The user has the rule's verbs on each of its resources. A `*` matches any one verb, resource or API group
   */
  private hasRule(rule: PolicyRule): boolean {
    const resources = rule.resources || [];
    const verbs = rule.verbs || [];

    if (!resources.length || !verbs.length) {
      return false;
    }

    return resources.every((resource) => {
      const schemas = this.schemasFor(rule.apiGroups || [], resource);

      return schemas.some((schema) => this.allowsVerbs(schema, verbs));
    });
  }

  /**
   * The schemas for a rule's resource in the current store, or the management store when the current one has none (e.g. a global resource
   * while in a downstream cluster)
   */
  private schemasFor(apiGroups: string[], resource: string): Schema[] {
    const currentStore = this.store.getters['currentStore']();
    const schemas = this.schemasIn(currentStore, apiGroups, resource);

    if (schemas.length || currentStore === STORE.MANAGEMENT) {
      return schemas;
    }

    return this.schemasIn(STORE.MANAGEMENT, apiGroups, resource);
  }

  private schemasIn(storeName: string, apiGroups: string[], resource: string): Schema[] {
    const schemas: Schema[] = this.store.getters[`${ storeName }/all`](SCHEMA) || [];

    return schemas.filter((schema) => this.matchesGroup(schema, apiGroups) && this.matchesResource(schema, resource));
  }

  private matchesGroup(schema: Schema, apiGroups: string[]): boolean {
    const group = schema.attributes?.group || '';

    return apiGroups.includes(ANY) || apiGroups.includes(group);
  }

  private matchesResource(schema: Schema, resource: string): boolean {
    if (resource === ANY) {
      return !!schema.attributes?.resource;
    }

    return schema.attributes?.resource === resource;
  }

  private allowsVerbs(schema: Schema, verbs: string[]): boolean {
    if (verbs.includes(ANY)) {
      return Object.keys(VERB_METHODS).some((verb) => this.allows(schema, verb));
    }

    return verbs.every((verb) => this.allows(schema, verb));
  }

  private allows(schema: Schema, verb: string): boolean {
    const verbMethod = VERB_METHODS[verb];

    if (!verbMethod) {
      return false;
    }

    const methods = schema[verbMethod.methods] || [];

    // Steve prefixes a method with blocked- when the UI shouldn't offer it, the user still has the right
    return methods.includes(verbMethod.method) || methods.includes(`blocked-${ verbMethod.method }`);
  }

  private async findPersonas(): Promise<Persona[]> {
    try {
      return await this.store.dispatch(`${ STORE.MANAGEMENT }/findAll`, { type: CUSTOMIZATION.PERSONA });
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
      const review: SelfSubjectRulesReview = await this.store.dispatch(`${ STORE.MANAGEMENT }/create`, {
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
