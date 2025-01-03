/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  extensionsSidebar: [
    {
      type:  'category',
      label: 'Extensions',
      link:  {
        type: 'doc',
        id:   'home',
      },
      items: [
        'introduction',
        {
          type:  'category',
          label: 'Changelog',
          link:  {
            type: 'doc',
            id:   'changelog',
          },
          items: ['rancher-2.9-support', 'rancher-2.10-support']
        },
        'support-matrix',
        'extensions-getting-started',
        'extensions-configuration',
        {
          type:  'category',
          label: 'Extensions API',
          link:  {
            type: 'doc',
            id:   'api/overview',
          },
          items: [
            'api/concepts',
            'api/metadata',
            {
              type:  'category',
              label: 'Navigation & Pages',
              items: [
                'api/nav/products',
                'api/nav/custom-page',
                'api/nav/resource-page',
                'api/nav/side-menu',
                'api/nav/routing',
              ]
            },
            'api/actions',
            'api/cards',
            'api/panels',
            'api/tabs',
            'api/table-columns',
            {
              type:  'category',
              label: 'Components',
              link:  {
                type: 'doc',
                id:   'api/components/components',
              },
              items: [
                'api/components/resources',
                'api/components/node-drivers',
                'api/components/auto-import',
              ]
            },
            'api/common',
          ]
        },
        {
          type:  'category',
          label: 'Advanced',
          items: [
            'advanced/air-gapped-environments',
            // 'advanced/fix-annotations-published-extensions',
            'advanced/provisioning',
            'advanced/localization',
            'advanced/hooks',
            'advanced/stores',
            'advanced/version-compatibility',
            'advanced/safe-mode',
            'advanced/yarn-link',
          ]
        },
        'publishing',
        {
          type:  'category',
          label: 'Use cases/Examples',
          link:  {
            type: 'doc',
            id:   'usecases/overview',
          },
          items: [
            'usecases/top-level-product',
            'usecases/cluster-level-product',
            {
              type:  'category',
              label: 'Node Driver',
              link:  {
                type: 'doc',
                id:   'usecases/node-driver/overview',
              },
              items: [
                'usecases/node-driver/about-drivers',
                'usecases/node-driver/cloud-credential',
                'usecases/node-driver/machine-config',
                'usecases/node-driver/node-driver-icon',
                'usecases/node-driver/advanced',
                'usecases/node-driver/proxying',
                'usecases/node-driver/about-example',
              ]
            }
          ]
        },
        'updating-extensions',
        'known-issues',
      ]
    },
  ]
};

module.exports = sidebars;
