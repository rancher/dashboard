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
                'api/components/auto-import',
              ]
            },
            'api/common',
          ]
        },
        {
          type:  'category',
          label: 'Cluster Provisioning',
          link:  {
            type: 'doc',
            id:   'provisioning/overview',
          },
          items: [
            {
              type:  'category',
              label: 'Custom Node Driver UI',
              link:  {
                type: 'doc',
                id:   'provisioning/node-driver/overview',
              },
              items: [
                'provisioning/node-driver/about-drivers',
                'provisioning/node-driver/machine-config',
                'provisioning/node-driver/advanced',
                'provisioning/node-driver/proxying',
                'provisioning/node-driver/about-example'
              ]
            },
            {
              type:  'category',
              label: 'Custom Hosted Provider UI',
              link:  {
                type: 'doc',
                id:   'provisioning/hosted-provider/overview',
              },
              items: [
                'provisioning/hosted-provider/structure',
                'provisioning/hosted-provider/components',
              ]
            },
            'provisioning/provider-icon',
            'provisioning/localization',
            'provisioning/cloud-credential',
          ]
        },
        {
          type:  'category',
          label: 'Advanced',
          items: [
            'advanced/create-page-in-an-existing-product',
            'advanced/air-gapped-environments',
            // 'advanced/fix-annotations-published-extensions',
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
            'usecases/node-driver',
            'usecases/hosted-provider'
          ]
        },
        'known-issues',
      ]
    },
  ]
};

module.exports = sidebars;
