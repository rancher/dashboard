import { roleTemplateRules } from '@shell/utils/validators/role-template';
import { RBAC } from '@shell/config/types';

const mockGetters = { 'i18n/t': (key: string) => key };

describe('roleTemplateRules', () => {
  it('adds no errors for valid rules with no type', () => {
    const rules = [{
      verbs: ['get'], resources: ['pods'], apiGroups: ['']
    }];
    const errors: string[] = [];

    roleTemplateRules(rules, mockGetters, errors);

    expect(errors).toStrictEqual([]);
  });

  it('adds missingVerb error when a rule has empty verbs', () => {
    const rules = [{
      verbs: [], resources: ['pods'], apiGroups: ['']
    }];
    const errors: string[] = [];

    roleTemplateRules(rules, mockGetters, errors);

    expect(errors).toStrictEqual(['validation.roleTemplate.roleTemplateRules.missingVerb']);
  });

  it('adds noResourceAndNonResource error when a rule has both resources and nonResourceURLs', () => {
    const rules = [{
      verbs:           ['get'],
      resources:       ['pods'],
      nonResourceURLs: ['/healthz'],
      apiGroups:       [''],
    }];
    const errors: string[] = [];

    roleTemplateRules(rules, mockGetters, errors);

    expect(errors).toStrictEqual(['validation.roleTemplate.roleTemplateRules.noResourceAndNonResource']);
  });

  it('adds missingResource error for RBAC.ROLE type when resources are empty', () => {
    const rules = [{
      verbs: ['get'], resources: [], nonResourceURLs: ['/healthz'], apiGroups: ['']
    }];
    const errors: string[] = [];

    roleTemplateRules(rules, mockGetters, errors, [RBAC.ROLE]);

    expect(errors).toStrictEqual(['validation.roleTemplate.roleTemplateRules.missingResource']);
  });

  it('adds missingApiGroup error for RBAC.ROLE type when apiGroups are empty', () => {
    const rules = [{
      verbs: ['get'], resources: ['pods'], apiGroups: []
    }];
    const errors: string[] = [];

    roleTemplateRules(rules, mockGetters, errors, [RBAC.ROLE]);

    expect(errors).toStrictEqual(['validation.roleTemplate.roleTemplateRules.missingApiGroup']);
  });

  it('adds noResourceAndNonResource error for non-RBAC.ROLE when rule has resources and nonResourceUrls', () => {
    const rules = [{
      verbs:           ['get'],
      resources:       ['pods'],
      nonResourceUrls: ['/healthz'],
      apiGroups:       [''],
    }];
    const errors: string[] = [];

    roleTemplateRules(rules, mockGetters, errors, [RBAC.CLUSTER_ROLE]);

    expect(errors).toStrictEqual(['validation.roleTemplate.roleTemplateRules.noResourceAndNonResource']);
  });

  it('adds missingOneResource error when rule has neither resources nor nonResourceURLs', () => {
    const rules = [{
      verbs: ['get'], resources: [], nonResourceURLs: [], apiGroups: []
    }];
    const errors: string[] = [];

    roleTemplateRules(rules, mockGetters, errors, [RBAC.CLUSTER_ROLE]);

    expect(errors).toStrictEqual(['validation.roleTemplate.roleTemplateRules.missingOneResource']);
  });

  it('adds multiple errors when multiple rules are invalid', () => {
    const rules = [
      {
        verbs: [], resources: ['pods'], apiGroups: ['']
      },
      {
        verbs: ['get'], resources: [], nonResourceURLs: [], apiGroups: []
      },
    ];
    const errors: string[] = [];

    roleTemplateRules(rules, mockGetters, errors, [RBAC.CLUSTER_ROLE]);

    expect(errors).toStrictEqual([
      'validation.roleTemplate.roleTemplateRules.missingVerb',
      'validation.roleTemplate.roleTemplateRules.missingOneResource',
    ]);
  });

  it('handles empty rules array with no errors', () => {
    const errors: string[] = [];

    roleTemplateRules([], mockGetters, errors);

    expect(errors).toStrictEqual([]);
  });

  it('uses default empty array for rules when not provided', () => {
    const errors: string[] = [];

    roleTemplateRules(undefined as any, mockGetters, errors);

    expect(errors).toStrictEqual([]);
  });

  it('adds both missingResource and missingApiGroup errors for RBAC.ROLE with empty resources and apiGroups', () => {
    const rules = [{
      verbs: ['get'], resources: [], nonResourceURLs: ['/healthz'], apiGroups: []
    }];
    const errors: string[] = [];

    roleTemplateRules(rules, mockGetters, errors, [RBAC.ROLE]);

    expect(errors).toStrictEqual([
      'validation.roleTemplate.roleTemplateRules.missingResource',
      'validation.roleTemplate.roleTemplateRules.missingApiGroup',
    ]);
  });

  it('does not add RBAC.ROLE-specific errors when type is not RBAC.ROLE', () => {
    const rules = [{
      verbs: ['get'], resources: ['pods'], apiGroups: ['']
    }];
    const errors: string[] = [];

    roleTemplateRules(rules, mockGetters, errors, [RBAC.CLUSTER_ROLE]);

    expect(errors).toStrictEqual([]);
  });
});
