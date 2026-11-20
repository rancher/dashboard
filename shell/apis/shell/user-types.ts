import { Store } from 'vuex';
import { CurrentUserTypesOptions, UserTypesApi, UserTypePreferences } from '@shell/apis/intf/shell';
import { AUTHORIZATION, CUSTOMIZATION, SCHEMA } from '@shell/config/types';
import UserType, { CUSTOMIZATION_API_GROUP } from '@shell/models/customization.ui.rancher.usertype';
import SelfSubjectRulesReview from '@shell/models/authorization.k8s.io.selfsubjectrulesreview';
import { PolicyRule } from '@shell/types/resources/rbac';
import { Schema } from '@shell/plugins/steve/schema';
import { STORE } from '@shell/store/store-types';
import { USER_TYPE_PREFERENCES } from '@shell/store/prefs';

/**
 * Maps each RBAC verb in a user type rule to the HTTP method that shows the user has it, and which of the schema's method lists holds it.
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
 * Shell implementation of the `UserTypesApi`
 */
export class UserTypesApiImpl implements UserTypesApi {
  private store: Store<any>;
  private assignedNames?: Promise<string[]>;

  constructor(store: Store<any>) {
    this.store = store;
  }

  public async currentUserTypes({ includeDisabled = false }: CurrentUserTypesOptions = {}): Promise<UserType[]> {
    const [userTypes, assignedNames] = await Promise.all([this.findUserTypes(), this.assignedUserTypeNames()]);
    const preferences = this.currentUserTypePreferences();

    return userTypes
      .filter((userType) => assignedNames.includes(userType.metadata.name) || this.isAssociated(userType))
      .filter((userType) => includeDisabled || !preferences[userType.metadata.name]?.disabled)
      .sort((a, b) => this.compareImportance(a, b, preferences));
  }

  public currentUserTypePreferences(): UserTypePreferences {
    return this.store.getters['prefs/get'](USER_TYPE_PREFERENCES) || {};
  }

  public async setCurrentUserTypePreferences(preferences: UserTypePreferences): Promise<void> {
    await this.store.dispatch('prefs/set', { key: USER_TYPE_PREFERENCES, value: preferences });
  }

  public async reorderCurrentUserTypes(order: string[]): Promise<void> {
    const userTypes = await this.findUserTypes();

    await this.setCurrentUserTypePreferences(this.preferencesForOrder(userTypes, order, this.currentUserTypePreferences()));
  }

  public async setCurrentUserTypeEnabled(name: string, enabled: boolean): Promise<void> {
    const preferences = { ...this.currentUserTypePreferences() };
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

    await this.setCurrentUserTypePreferences(preferences);
  }

  public refreshCurrentUserTypes(options?: CurrentUserTypesOptions): Promise<UserType[]> {
    this.reset();

    return this.currentUserTypes(options);
  }

  /**
   * Forget the user types assigned to the user, so the next request fetches them. Called on log out
   */
  public reset() {
    delete this.assignedNames;
  }

  /**
   * Most important first: the highest priority (the user's own, else the user type's), then by display name
   */
  private compareImportance(a: UserType, b: UserType, preferences: UserTypePreferences): number {
    const byPriority = this.effectivePriority(b, preferences) - this.effectivePriority(a, preferences);

    if (byPriority) {
      return byPriority;
    }

    return (a.spec?.displayName || '').localeCompare(b.spec?.displayName || '');
  }

  /**
   * How important a user type is to the user: their own priority for it if they've set one, else the user type's (a user type without one is 0)
   */
  private effectivePriority(userType: UserType, preferences: UserTypePreferences): number {
    return preferences[userType.metadata.name]?.priority ?? userType.spec?.priority ?? 0;
  }

  /**
   * The user's preferences after they put their user types in `order` (user type names, most important first). Only the priorities change.
   *
   * The listed user types' current priorities are handed out again in the new order, highest first, so the user's priorities stay on the
   * same scale as the user types' own and a user type without one (e.g. a new one) still lands where its priority puts it. A priority that
   * would tie with or pass the one above becomes one less than it
   */
  private preferencesForOrder(userTypes: UserType[], order: string[], preferences: UserTypePreferences): UserTypePreferences {
    const listed = order
      .map((name) => userTypes.find((userType) => userType.metadata.name === name))
      .filter((userType): userType is UserType => !!userType);
    const values = listed.map((userType) => this.effectivePriority(userType, preferences)).sort((a, b) => b - a);
    const out = { ...preferences };

    listed.forEach((userType, i) => {
      const name = userType.metadata.name;
      const above = i ? out[listed[i - 1].metadata.name].priority : undefined;
      const priority = above === undefined ? values[i] : Math.min(values[i], above - 1);

      out[name] = { ...out[name], priority };
    });

    return out;
  }

  /**
   * Is the user type associated with the user via resource permissions: do they have the rights in any one of its rules
   */
  private isAssociated(userType: UserType): boolean {
    return (userType.spec?.rules || []).some((rule) => this.hasRule(rule));
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

  private async findUserTypes(): Promise<UserType[]> {
    try {
      return await this.store.dispatch(`${ STORE.MANAGEMENT }/findAll`, { type: CUSTOMIZATION.USER_TYPE });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Unable to list user types, the current user is treated as having none', e);

      return [];
    }
  }

  /**
   * The names of the user types assigned to the user, by an admin binding them (or a group they're in) to the user type's global role
   */
  private assignedUserTypeNames(): Promise<string[]> {
    if (!this.assignedNames) {
      this.assignedNames = this.fetchAssignedUserTypeNames();
    }

    return this.assignedNames;
  }

  private async fetchAssignedUserTypeNames(): Promise<string[]> {
    try {
      // The review needs a namespace. Global role rules are cluster wide, so they're returned for any
      const review: SelfSubjectRulesReview = await this.store.dispatch(`${ STORE.MANAGEMENT }/create`, {
        type: AUTHORIZATION.SELF_SUBJECT_RULES_REVIEW,
        spec: { namespace: 'default' },
      });

      await review.save();

      // Only explicit rules count, wildcards (e.g. an admin's) don't assign a user type
      const names = (review.status?.resourceRules || [])
        .filter((rule) => rule.verbs?.includes('have') && rule.apiGroups?.includes(CUSTOMIZATION_API_GROUP) && rule.resources?.includes('usertypes'))
        .flatMap((rule) => rule.resourceNames || []);

      return [...new Set(names)];
    } catch (e) {
      // Don't keep the failure, the next request tries again
      delete this.assignedNames;

      // eslint-disable-next-line no-console
      console.warn('Unable to find the user types assigned to the current user', e);

      return [];
    }
  }
}
