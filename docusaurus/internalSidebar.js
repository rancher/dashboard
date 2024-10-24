/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  internalSidebar: [
    'docs',
    {
      type:  'category',
      label: 'Getting Started',
      items: [
        'getting-started/quickstart',
        'getting-started/concepts',
        'getting-started/development_environment',
        'getting-started/ui-walkthrough'
      ],
    },
    {
      type:  'category',
      label: 'Guide',
      items: [
        'guide/package-management',
        'guide/auth-providers',
        'guide/custom-dev-build'
      ],
    },
    {
      type:  'category',
      label: 'How the Code Base Works',
      items: [
        'code-base-works/api-resources-and-schemas',
        'code-base-works/auth-sessions-and-tokens',
        'code-base-works/cluster-management-resources',
        'code-base-works/customising-how-k8s-resources-are-presented',
        'code-base-works/directory-structure',
        'code-base-works/products-and-navigation',
        'code-base-works/forms-and-validation',
        'code-base-works/helm-chart-apps',
        'code-base-works/keyboard-shortcuts',
        'code-base-works/kubernetes-resources-data-load',
        'code-base-works/routes',
        'code-base-works/middleware',
        'code-base-works/stores',
        'code-base-works/nuxt-plugins',
        'code-base-works/machine-drivers',
        'code-base-works/performance',
        'code-base-works/sortable-table',
        'code-base-works/on-screen-text-and-translations',
        'code-base-works/style',
      ],
    },
    'storybook',
    {
      type:  'category',
      label: 'Testing',
      items: [
        'testing/unit-test',
        'testing/e2e-test',
        'testing/stress-test',
      ],
    },
    'terminology',
  ],
};

module.exports = sidebars;
