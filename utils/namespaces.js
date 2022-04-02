import { sortBy } from '@/utils/sort';

// This method is used by the NameNsDescription component and by the create/edit
// workload form to provide namespaces to choose from.
const getAvailableNamespaces = (resource) => {
  const inStore = resource.$store.getters['currentStore'](resource.namespaceType || 'namespace');
  const choices = resource.$store.getters[`${ inStore }/all`](resource.namespaceType || 'namespace');

  const out = sortBy(
    choices.filter( (N) => {
      const isSettingSystemNamespace = resource.$store.getters['systemNamespaces'].includes(N.metadata.name);

      return resource.isVirtualCluster ? !N.isSystem && !N.isFleetManaged && !isSettingSystemNamespace : true;
    }).map((obj) => {
      return {
        label: obj.nameDisplay,
        value: obj.id,
      };
    }),
    'label'
  );

  if (resource.forceNamespace) {
    out.unshift({
      label: resource.forceNamespace,
      value: resource.forceNamespace,
    });
  }

  return out;
};

export default getAvailableNamespaces;
