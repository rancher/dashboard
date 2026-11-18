import { grantResourceOptions, normaliseRuleApiGroups, GrantResourceRule } from '@shell/utils/grant-resources';
import { SCOPED_RESOURCE_GROUPS } from '@shell/config/roles';

describe('utils: grant-resources', () => {
  describe('grantResourceOptions', () => {
    const t = (key: string) => key;
    const resourceValues = (scopes: SCOPED_RESOURCE_GROUPS[]) => grantResourceOptions(t, scopes)
      .filter((option) => typeof option.value === 'object')
      .map((option) => option.value);

    const ALL = [SCOPED_RESOURCE_GROUPS.GLOBAL, SCOPED_RESOURCE_GROUPS.CLUSTER, SCOPED_RESOURCE_GROUPS.PROJECT_NAMESPACE];

    it.each([
      [[SCOPED_RESOURCE_GROUPS.GLOBAL], { resourceName: 'clusters', apiGroupValue: 'management.cattle.io' }],
      [[SCOPED_RESOURCE_GROUPS.CLUSTER], { resourceName: 'nodes', apiGroupValue: '' }],
      [[SCOPED_RESOURCE_GROUPS.PROJECT_NAMESPACE], { resourceName: 'deployments', apiGroupValue: 'apps' }],
    ])('should offer a resource from scope %p', (scopes, resource) => {
      expect(resourceValues(scopes)).toContainEqual(resource);
    });

    it.each([
      [{ resourceName: 'clusters', apiGroupValue: 'management.cattle.io' }],
      [{ resourceName: 'nodes', apiGroupValue: '' }],
    ])('should not offer %p when only the namespaced scope is asked for', (resource) => {
      expect(resourceValues([SCOPED_RESOURCE_GROUPS.PROJECT_NAMESPACE])).not.toContainEqual(resource);
    });

    it('should offer every scope when all are asked for', () => {
      const values = resourceValues(ALL);

      expect(values).toContainEqual({ resourceName: 'clusters', apiGroupValue: 'management.cattle.io' });
      expect(values).toContainEqual({ resourceName: 'nodes', apiGroupValue: '' });
      expect(values).toContainEqual({ resourceName: 'deployments', apiGroupValue: 'apps' });
    });

    it.each([
      [SCOPED_RESOURCE_GROUPS.CLUSTER, 'rbac.roletemplate.tabs.grantResources.noApiGroupClusterScope'],
      [SCOPED_RESOURCE_GROUPS.PROJECT_NAMESPACE, 'rbac.roletemplate.tabs.grantResources.noApiGroupNamespaceScope'],
    ])('should label the core API group by scope for %p', (scope, label) => {
      const groups = grantResourceOptions(t, [scope]).filter((option) => option.kind === 'group');

      expect(groups[0]).toStrictEqual({
        kind: 'group', optionKey: label, label, value: '', disabled: true
      });
    });

    it('should end with the hidden option', () => {
      const options = grantResourceOptions(t, ALL);

      expect(options[options.length - 1]).toStrictEqual({
        kind: 'group', optionKey: 'hiddenOption', label: '_', value: '', disabled: true
      });
    });
  });

  describe('normaliseRuleApiGroups', () => {
    it.each([
      [['""'], ['']],
      [[' "" '], ['']],
      [['apps', '""'], ['apps', '']],
      [['apps'], ['apps']],
      [[''], ['']],
    ])('should map API groups %p to %p', (apiGroups, expected) => {
      const rules: GrantResourceRule[] = [{
        apiGroups, resources: ['pods'], verbs: ['get']
      }];

      normaliseRuleApiGroups(rules);

      expect(rules[0].apiGroups).toStrictEqual(expected);
    });

    it('should leave a rule without API groups alone', () => {
      const rules: GrantResourceRule[] = [{ resources: ['pods'], verbs: ['get'] }];

      normaliseRuleApiGroups(rules);

      expect(rules[0]).toStrictEqual({ resources: ['pods'], verbs: ['get'] });
    });
  });
});
