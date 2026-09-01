import { IPlugin } from '@shell/core/types';

type DocStringMap = {[key:string]: string};

type DocReplacement = {
  from: string;
  to: string;
};

// String to use in doc references that should be replaced with the current Rancher version
const VERSION_MARKER = '$V$';

// We use an array like this because it is easier to see the from and to
// If we just used a map, the lines are so long, they are difficult to see and edit in the IDE
// This will be turned into a simpler map when we process them to replace the dynamic version number
const DOC_REPLACEMENTS = [
  {
    from: 'https://ranchermanager.docs.rancher.com/$V$',
    to:   'https://documentation.suse.com/cloudnative/rancher-manager/$V$/en/about-rancher/what-is-rancher.html'
  },
  {
    from: 'https://ranchermanager.docs.rancher.com/$V$/how-to-guides/new-user-guides/authentication-permissions-and-global-configuration/authentication-config#external-authentication-configuration-and-principal-users',
    to:   'https://documentation.suse.com/cloudnative/rancher-manager/$V$/en/rancher-admin/users/authn-and-authz/authn-and-authz.html#_external_authentication_configuration_and_principal_users'
  },
  {
    from: 'https://ranchermanager.docs.rancher.com/$V$/admin-settings/authentication/google/#3-creating-service-account-credential',
    to:   'https://documentation.suse.com/cloudnative/rancher-manager/$V$/en/rancher-admin/users/authn-and-authz/configure-google-oauth.html#_3_creating_service_account_credentials'
  },
  {
    from: 'https://ranchermanager.docs.rancher.com/$V$/monitoring-alerting/configuration/#alertmanager-configuration/',
    to:   'https://documentation.suse.com/cloudnative/rancher-manager/$V$/en/observability/monitoring-and-dashboards/configuration/configuration.html#_alertmanager_configuration'
  },
  {
    from: 'https://ranchermanager.docs.rancher.com/$V$/how-to-guides/new-user-guides/launch-kubernetes-with-rancher/rke1-vs-rke2-differences#cluster-api',
    to:   'https://documentation.suse.com/cloudnative/rancher-manager/$V$/en/cluster-deployment/rke1-vs-rke2.html#_cluster_api'
  },
  {
    from: 'https://ranchermanager.docs.rancher.com/how-to-guides/new-user-guides/kubernetes-clusters-in-rancher-setup/set-up-cloud-providers/amazon',
    to:   'https://documentation.suse.com/cloudnative/rancher-manager/latest/en/cluster-deployment/set-up-cloud-providers/amazon.html'
  },
  {
    from: 'https://ranchermanager.docs.rancher.com/how-to-guides/new-user-guides/kubernetes-clusters-in-rancher-setup/set-up-cloud-providers/azure',
    to:   'https://documentation.suse.com/cloudnative/rancher-manager/latest/en/cluster-deployment/set-up-cloud-providers/azure.html'
  },
  {
    from: 'https://ranchermanager.docs.rancher.com/reference-guides/cluster-configuration/rancher-server-configuration/rke2-cluster-configuration#additionalmanifest',
    to:   'https://documentation.suse.com/cloudnative/rancher-manager/latest/en/cluster-deployment/configuration/k3s.html#_additionalmanifest',
  },
  {
    from: 'https://ranchermanager.docs.rancher.com/$V$/integrations-in-rancher/logging/logging-helm-chart-options',
    to:   'https://documentation.suse.com/cloudnative/rancher-manager/$V$/en/observability/logging/logging-helm-chart-options.html'
  },
  {
    from: 'https://ranchermanager.docs.rancher.com/$V$/monitoring-alerting/',
    to:   'https://documentation.suse.com/cloudnative/rancher-manager/$V$/en/observability/monitoring-and-dashboards/monitoring-and-dashboards.html',
  },
  {
    from: 'https://ranchermanager.docs.rancher.com/$V$/reference-guides/cluster-configuration/rancher-server-configuration/aks-cluster-configuration#support-private-kubernetes-service',
    to:   'https://documentation.suse.com/cloudnative/rancher-manager/$V$/en/cluster-deployment/hosted-kubernetes/aks/configuration.html#_support_private_kubernetes_service'
  },
  {
    from: 'https://ranchermanager.docs.rancher.com/how-to-guides/new-user-guides/kubernetes-clusters-in-rancher-setup/set-up-clusters-from-hosted-kubernetes-providers/gke',
    to:   'https://documentation.suse.com/cloudnative/rancher-manager/latest/en/cluster-deployment/hosted-kubernetes/gke/gke.html'
  },
  {
    from: 'https://docs.rke2.io/install/containerd_registry_configuration',
    to:   'https://documentation.suse.com/cloudnative/rke2/latest/en/install/containerd_registry_configuration.html'
  },
  {
    from: 'https://docs.rke2.io/security/hardening_guide',
    to:   'https://documentation.suse.com/cloudnative/rke2/latest/en/security/hardening_guide.html'
  },
  {
    from: 'https://docs.k3s.io/installation/private-registry',
    to:   'https://documentation.suse.com/cloudnative/k3s/latest/en/installation/private-registry.html'
  },
  {
    from: 'https://docs.rke2.io/install/private_registry',
    to:   'https://documentation.suse.com/cloudnative/rke2/latest/en/install/containerd_registry_configuration.html'
  },
  {
    from: 'https://docs.harvesterhci.io/',
    to:   'https://documentation.suse.com/cloudnative/virtualization/v1.3/en/introduction/overview.html'
  },
];

// Map will be generated from the DOC_REPLACEMENTS array
const DOC_MAP: DocStringMap = {};

/**
 * Installs a link handler that intercepts links and replaces the community links with the Rancher Prime
 * documentation links
 */
export function installDocHandler(plugin: IPlugin) {
  // Allow doc links to be intercepted
  plugin.register('linkInterceptor', 'prime-doc-links', (link: string) => {
    // Returning undefined will leave the link unchanged
    return DOC_MAP[link];
  });

  // Initialize the documentation mapping, replacing the version marker with the current Rancher version
  DOC_REPLACEMENTS.forEach((r: DocReplacement) => {
    // Update the links for the current version of Rancher if required
    const from = r.from.replaceAll(VERSION_MARKER, plugin.environment.docsVersion);
    const to = r.to.replaceAll(VERSION_MARKER, plugin.environment.docsVersion);

    DOC_MAP[from] = to;
  });
}
