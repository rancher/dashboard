import { SCOPED_RESOURCES, SCOPED_RESOURCE_GROUPS } from '@shell/config/roles';
import { PolicyRule } from '@shell/types/resources/rbac';

export interface GrantResourceOption {
  kind?: string;
  optionKey: string;
  label: string;
  value: string | { resourceName: string, apiGroupValue: string };
  disabled?: boolean;
}

type ScopedResources = Record<string, Record<string, { resources: string[], deprecatedResources?: string[] }>>;

/**
 * The resources offered in the Grant Resources resource select, grouped under their API group, for the given scopes
 */
export function grantResourceOptions(t: (key: string) => string, scopes: SCOPED_RESOURCE_GROUPS[]): GrantResourceOption[] {
  const options: GrantResourceOption[] = [];
  const scopedResources = SCOPED_RESOURCES as ScopedResources;

  scopes.forEach((scope) => {
    const apiGroupsInScope = scopedResources[scope];

    const apiGroupNames = Object.keys(apiGroupsInScope);

    // Put each API group as a header and put its resources under it.
    apiGroupNames.forEach((apiGroup) => {
      // Add API group as the header for a group of related resources.
      let apiGroupLabel = apiGroup;
      let apiGroupValue = apiGroup;

      if (apiGroup === 'coreKubernetesApi') {
        // If a resource belongs to the core Kubernetes API,
        // the API group is technically an empty string but
        // we will label it "Core K8s API, Cluster Scoped."

        // Some core Kubernetes resources are namespaced,
        // in which case they go under a different heading
        // "Core K8s API, Namespaced." This lets us
        // separate them by scope.
        const labelForNoApiGroup = t('rbac.roletemplate.tabs.grantResources.noApiGroupClusterScope');
        const labelForNamespacedResourcesWithNoApiGroup = t('rbac.roletemplate.tabs.grantResources.noApiGroupNamespaceScope');

        apiGroupLabel = scope.includes('cluster') ? labelForNoApiGroup : labelForNamespacedResourcesWithNoApiGroup;
        apiGroupValue = '';
      }

      if (apiGroup === 'neuvectorApi') {
        // Some NeuVector resources are namespaced, in which case they go under a different heading
        const labelForClusterScoped = t('rbac.roletemplate.tabs.grantResources.neuvector.labelClusterScoped');
        const labelForNamespaceScoped = t('rbac.roletemplate.tabs.grantResources.neuvector.labelNamespaceScoped');

        apiGroupLabel = scope.includes('cluster') ? labelForClusterScoped : labelForNamespaceScoped;
        apiGroupValue = 'permission.neuvector.com';
      }

      options.push({
        kind:      'group',
        optionKey: apiGroupLabel,
        label:     apiGroupLabel,
        value:     apiGroupValue,
        disabled:  true,
      });

      const resourcesInApiGroup = apiGroupsInScope[apiGroup].resources;

      // Add non-deprecated resources to the resource options list
      resourcesInApiGroup.forEach((resourceName) => {
        options.push({
          label:     resourceName,
          // Use unique key for resource list in the Select dropdown
          optionKey: apiGroupValue.concat(resourceName),
          value:     {
            resourceName: resourceName.toLowerCase(),
            apiGroupValue
          }
        });
      });

      // If the API group has any deprecated options,
      // list them as "Resource Name (deprecated)"
      if (apiGroupsInScope[apiGroup].deprecatedResources) {
        const deprecatedResourcesInApiGroup = apiGroupsInScope[apiGroup].deprecatedResources || [];
        const deprecatedLabel = t('rbac.roletemplate.tabs.grantResources.deprecatedLabel');

        deprecatedResourcesInApiGroup.forEach((resourceName) => {
          options.push({
            label:     `${ resourceName } ${ deprecatedLabel }`,
            optionKey: apiGroupValue.concat(resourceName),
            value:     {
              resourceName: resourceName.toLowerCase(),
              apiGroupValue
            }
          });
        });
      }
    });
  });

  options.push({
    // This hidden option is to work around a bug in the Select
    // component where an option marked as disabled
    // is still selected by default if is value is an empty string.

    // In the Role or Project Role form, an API group will be the
    // default choice for the namespace value because there's only
    // one option with the value as an empty string and that's the default
    // value for the namespace. It's not good to have an API
    // group as the default value for a resource.
    // Adding this option means there are least two values with an
    // empty string in the options, preventing the Select from
    // selecting a disabled header group as the resource by default.

    // This bug is such an edge case that I can't imagine anyone
    // else hitting it, so I figured the workaround is better
    // than fixing the select.
    kind:      'group',
    optionKey: 'hiddenOption',
    label:     '_',
    value:     '',
    disabled:  true,
  });

  return options;
}

/**
 * k8s documentation shows the core API group as "" - store it as an empty string
 */
export function normaliseRuleApiGroups(rules: PolicyRule[] = []): void {
  rules.forEach((rule) => {
    if (rule.apiGroups) {
      rule.apiGroups = rule.apiGroups.map((group) => (group.trim() === '""' ? '' : group));
    }
  });
}
