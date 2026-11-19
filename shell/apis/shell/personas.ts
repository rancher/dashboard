import { Store } from 'vuex';
import { CurrentUsersPersonasOptions, PersonasApi, PersonaPreferences } from '@shell/apis/intf/shell';
import { AUTHORIZATION, CUSTOMIZATION, SCHEMA } from '@shell/config/types';
import Persona, { PERSONA_API_GROUP } from '@shell/models/customization.ui.rancher.persona';
import SelfSubjectRulesReview from '@shell/models/authorization.k8s.io.selfsubjectrulesreview';
import { PolicyRule } from '@shell/types/resources/rbac';
import { Schema } from '@shell/plugins/steve/schema';
import { STORE } from '@shell/store/store-types';
import { PERSONA_PRIORITIES } from '@shell/store/prefs';

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

  public async currentUsersPersonas({ includeDisabled = false }: CurrentUsersPersonasOptions = {}): Promise<Persona[]> {
    const [personas, assignedNames] = await Promise.all([this.findPersonas(), this.assignedPersonaNames()]);
    const preferences = this.currentUsersPersonaPreferences();

    return personas
      .filter((persona) => assignedNames.includes(persona.metadata.name) || this.isAssociated(persona))
      .filter((persona) => includeDisabled || !preferences[persona.metadata.name]?.disabled)
      .sort((a, b) => this.compareImportance(a, b, preferences));
  }

  public currentUsersPersonaPreferences(): PersonaPreferences {
    return this.store.getters['prefs/get'](PERSONA_PRIORITIES) || {};
  }

  public async setCurrentUsersPersonaPreferences(preferences: PersonaPreferences): Promise<void> {
    await this.store.dispatch('prefs/set', { key: PERSONA_PRIORITIES, value: preferences });
  }

  public async reorderCurrentUsersPersonas(order: string[]): Promise<void> {
    const personas = await this.findPersonas();

    await this.setCurrentUsersPersonaPreferences(this.preferencesForOrder(personas, order, this.currentUsersPersonaPreferences()));
  }

  public async setCurrentUsersPersonaEnabled(name: string, enabled: boolean): Promise<void> {
    const preferences = { ...this.currentUsersPersonaPreferences() };
    const preference = { ...preferences[name] };

    if (enabled) {
      delete preference.disabled;
    } else {
      preference.disabled = true;
    }

    preferences[name] = preference;

    // An entry with nothing left in it is no preference at all
    if (!Object.keys(preference).length) {
      delete preferences[name];
    }

    await this.setCurrentUsersPersonaPreferences(preferences);
  }

  public refreshCurrentUsersPersonas(options?: CurrentUsersPersonasOptions): Promise<Persona[]> {
    this.reset();

    return this.currentUsersPersonas(options);
  }

  /**
   * Forget the personas assigned to the user, so the next request fetches them. Called on log out
   */
  public reset() {
    delete this.assignedNames;
  }

  /**
   * Most important first: the highest priority (the user's own, else the persona's), then by display name
   */
  private compareImportance(a: Persona, b: Persona, preferences: PersonaPreferences): number {
    const byPriority = this.effectivePriority(b, preferences) - this.effectivePriority(a, preferences);

    if (byPriority) {
      return byPriority;
    }

    return (a.spec?.displayName || '').localeCompare(b.spec?.displayName || '');
  }

  /**
   * How important a persona is to the user: their own priority for it if they've set one, else the persona's (a persona without one is 0)
   */
  private effectivePriority(persona: Persona, preferences: PersonaPreferences): number {
    return preferences[persona.metadata.name]?.priority ?? persona.spec?.priority ?? 0;
  }

  /**
   * The user's preferences after they put their personas in `order` (persona names, most important first). Only the priorities change.
   *
   * The listed personas' current priorities are handed out again in the new order, highest first, so the user's priorities stay on the
   * same scale as the personas' own and a persona without one (e.g. a new one) still lands where its priority puts it. A priority that
   * would tie with or pass the one above becomes one less than it
   */
  private preferencesForOrder(personas: Persona[], order: string[], preferences: PersonaPreferences): PersonaPreferences {
    const listed = order
      .map((name) => personas.find((persona) => persona.metadata.name === name))
      .filter((persona): persona is Persona => !!persona);
    const values = listed.map((persona) => this.effectivePriority(persona, preferences)).sort((a, b) => b - a);
    const out = { ...preferences };

    listed.forEach((persona, i) => {
      const name = persona.metadata.name;
      const above = i ? out[listed[i - 1].metadata.name].priority : undefined;
      const priority = above === undefined ? values[i] : Math.min(values[i], above - 1);

      out[name] = { ...out[name], priority };
    });

    return out;
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
