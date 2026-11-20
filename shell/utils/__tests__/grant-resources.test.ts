import { grantResourceHeaders, grantResourceOptions, grantResourceRows, normaliseRuleApiGroups } from '@shell/utils/grant-resources';
import { SCOPED_RESOURCE_GROUPS } from '@shell/config/roles';
import { PolicyRule } from '@shell/types/resources/rbac';

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
      const rules: PolicyRule[] = [{
        apiGroups, resources: ['pods'], verbs: ['get']
      }];

      normaliseRuleApiGroups(rules);

      expect(rules[0].apiGroups).toStrictEqual(expected);
    });

    it('should leave a rule without API groups alone', () => {
      const rules: PolicyRule[] = [{ resources: ['pods'], verbs: ['get'] }];

      normaliseRuleApiGroups(rules);

      expect(rules[0]).toStrictEqual({ resources: ['pods'], verbs: ['get'] });
    });
  });

  describe('grantResourceHeaders', () => {
    const names = (headers: { name: string }[]) => headers.map((header) => header.name);

    it('should have a column per verb, then custom verbs, resources, non-resource URLs and API groups', () => {
      expect(names(grantResourceHeaders())).toStrictEqual([
        'create', 'delete', 'get', 'list', 'patch', 'update', 'watch', 'custom', 'resources', 'url', 'apiGroups'
      ]);
    });

    it('should leave out the non-resource URLs column when asked', () => {
      expect(names(grantResourceHeaders({ nonResourceUrls: false }))).not.toContain('url');
    });
  });

  describe('grantResourceRows', () => {
    it('should tick the rule\'s verbs and flag custom ones', () => {
      const [row] = grantResourceRows([{
        apiGroups: ['apps'], resources: ['deployments'], verbs: ['get', 'list', 'escalate']
      }]);

      expect(row).toStrictEqual(expect.objectContaining({
        index: 0, apiGroups: ['apps'], resources: ['deployments'], hasGet: true, hasList: true, hasCreate: false, hasCustomVerbs: true
      }));
    });

    it('should tick every verb for *', () => {
      const [row] = grantResourceRows([{ resources: ['pods'], verbs: ['*'] }]);

      expect(['hasCreate', 'hasDelete', 'hasGet', 'hasList', 'hasPatch', 'hasUpdate', 'hasWatch'].every((key) => row[key] === true)).toBe(true);
    });

    it('should default a rule\'s missing fields', () => {
      expect(grantResourceRows([{}])).toStrictEqual([expect.objectContaining({
        apiGroups: [''], resources: [], nonResourceURLs: [], verbs: [], hasCustomVerbs: false, hasGet: false
      })]);
    });
  });
});
