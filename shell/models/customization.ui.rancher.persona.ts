import SteveModel from '@shell/plugins/steve/steve-class';
import { set } from '@shell/utils/object';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { RancherKubeMetadata } from '@shell/types/rancher/steve.api';
import { GlobalRoleBinding } from '@shell/types/resources/global-role-binding';
import { PolicyRule } from '@shell/types/resources/rbac';

export interface PersonaSpec {
  displayName: string;
  priority: number;
  tags?: string[];
  rules?: PolicyRule[];
}

type GlobalRoleBindingModel = GlobalRoleBinding & { remove: (opt?: object) => Promise<void> };

export const PERSONA_API_GROUP = 'customization.ui.rancher';

/**
 * Labels the global role bindings that assign a persona, so they can be found without fetching every binding
 */
export const PERSONA_LABEL = `${ PERSONA_API_GROUP }/persona`;

export default class Persona extends SteveModel {
  declare type: string;
  declare metadata: RancherKubeMetadata;
  declare spec: PersonaSpec;

  applyDefaults() {
    set(this, 'spec', { ...this.createDefaultSpec(), ...this.spec });
  }

  private createDefaultSpec(): PersonaSpec {
    return {
      displayName: '',
      priority:    0,
      tags:        [],
    };
  }

  /**
   * Shown in the detail page's masthead
   */
  get details() {
    const out = this._details;
    const tags = this.spec?.tags || [];

    out.unshift(
      { label: this.t('persona.displayName.label'), content: this.spec?.displayName },
      { label: this.t('persona.priority.label'), content: this.spec?.priority ?? 0 },
      ...(tags.length ? [{ label: this.t('persona.tags.label'), content: tags.join(', ') }] : []),
    );

    return out;
  }

  get customValidationRules() {
    return [
      {
        path:       'spec.rules',
        validators: [`roleTemplateRules:${ this.type }`],
        nullable:   true,
        type:       'array',
      },
    ];
  }

  /**
   * The global role that assigns this persona: users and groups bound to it have the persona
   */
  get globalRoleName(): string {
    return `persona-${ this.metadata.name }`;
  }

  /**
   * Find this persona's global role, or create it. The persona must be saved first, the role's owner reference needs its uid
   */
  async ensureGlobalRole() {
    try {
      return await this.$dispatch('management/find', { type: MANAGEMENT.GLOBAL_ROLE, id: this.globalRoleName }, { root: true });
    } catch (e: any) {
      if (e?.status !== 404 && e?._status !== 404) {
        throw e;
      }
    }

    const role = await this.$dispatch('management/create', {
      type:     MANAGEMENT.GLOBAL_ROLE,
      metadata: {
        name:            this.globalRoleName,
        ownerReferences: [{
          apiVersion: `${ PERSONA_API_GROUP }/v1`,
          kind:       'Persona',
          name:       this.metadata.name,
          uid:        this.metadata.uid,
        }],
      },
      displayName: `Persona: ${ this.spec.displayName }`,
      rules:       [{
        apiGroups:     [PERSONA_API_GROUP],
        resources:     ['personas'],
        resourceNames: [this.metadata.name],
        verbs:         ['assume'],
      }],
    }, { root: true });

    // The global role model's save() goes through Norman, which drops metadata.ownerReferences and generates the name
    await role._save();

    return role;
  }

  /**
   * The principal ids (users and groups) bound to this persona's global role
   */
  async assignedPrincipalIds(): Promise<string[]> {
    const bindings = await this.findBindings();

    return bindings.map((binding) => this.principalIdFor(binding)).filter((id): id is string => !!id);
  }

  /**
   * Bind exactly the given principals (users and groups) to this persona's global role, creating the role if needed
   */
  async assignPrincipals(principalIds: string[]) {
    await this.ensureGlobalRole();

    const bindings = await this.findBindings();
    const currentIds = bindings.map((binding) => this.principalIdFor(binding));
    const toAdd = principalIds.filter((id) => !currentIds.includes(id));
    const toRemove = bindings.filter((binding) => {
      const id = this.principalIdFor(binding);

      return id && !principalIds.includes(id);
    });

    // Add before removing, as GlobalRoleBindings does
    const principals = await Promise.all(toAdd.map((id) => this.findPrincipal(id)));
    const added = await Promise.all(principals.map((principal) => this.$dispatch('management/create', {
      type:     MANAGEMENT.GLOBAL_ROLE_BINDING,
      metadata: {
        generateName: 'grb-',
        labels:       { [PERSONA_LABEL]: this.metadata.name },
      },
      globalRoleName: this.globalRoleName,
      ...(principal.principalType === 'group' ? { groupPrincipalName: principal.id } : { userPrincipalName: principal.id }),
    }, { root: true })));

    // The global role binding model's save() goes through Norman, which drops the label
    await Promise.all(added.map((binding: any) => binding._save({ redirectUnauthorized: false })));
    await Promise.all(toRemove.map((binding) => binding.remove({ redirectUnauthorized: false })));
  }

  private async findBindings(): Promise<GlobalRoleBindingModel[]> {
    // Transient, so this persona's bindings don't replace the global role bindings already in the store
    const res = await this.$dispatch('management/findLabelSelector', {
      type:     MANAGEMENT.GLOBAL_ROLE_BINDING,
      matching: { labelSelector: { matchLabels: { [PERSONA_LABEL]: this.metadata.name } } },
      opt:      { transient: true },
    }, { root: true });

    return res.data;
  }

  private findPrincipal(id: string): Promise<{ id: string, principalType: string }> {
    // urlFor doesn't encode the id, and a principal id contains '://'
    return this.$dispatch('rancher/find', {
      type: NORMAN.PRINCIPAL,
      id,
      opt:  { url: `/v3/principals/${ encodeURIComponent(id) }` }
    }, { root: true });
  }

  private principalIdFor(binding: GlobalRoleBinding): string | undefined {
    return binding.groupPrincipalName || binding.userPrincipalName;
  }
}
