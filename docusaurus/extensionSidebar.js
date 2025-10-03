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
        'folder-structure',
        'configuration',
        {
          type:  'category',
          label: 'Performance',
          items: [
            'performance/overview',
            {
              type:  'category',
              label: 'Resource Scaling',
              items: [
                'performance/scaling/overview',
                {
                  type:  'doc',
                  id:    'performance/scaling/global-config',
                  label: 'Update Global Config',
                },
                {
                  type:  'doc',
                  id:    'performance/scaling/lists',
                  label: 'Update Lists',
                },
                {
                  type:  'doc',
                  id:    'performance/scaling/selects',
                  label: 'Update Select Components',
                },
                {
                  type:  'doc',
                  id:    'performance/scaling/requests',
                  label: 'Update Requests',
                },
              ],
            }],
        },
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
                'api/nav/templates',
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
                {
                  type:  'category',
                  label: 'Custom Node Driver UI',
                  link:  {
                    type: 'doc',
                    id:   'api/components/node-driver/overview',
                  },
                  items: [
                    'api/components/node-driver/about-drivers',
                    'api/components/node-driver/cloud-credential',
                    'api/components/node-driver/machine-config',
                    'api/components/node-driver/node-driver-icon',
                    'api/components/node-driver/advanced',
                    'api/components/node-driver/proxying',
                    'api/components/node-driver/about-example'
                  ]
                },
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
            'advanced/create-page-in-an-existing-product',
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
        'catalog',
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
            'usecases/node-driver'
          ]
        },
        'updating-extensions',
        'known-issues',
      ]
    },
  ]
};

module.exports = sidebars;
