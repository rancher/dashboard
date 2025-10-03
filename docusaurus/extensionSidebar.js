// We use Node's built-in 'fs' and 'path' modules to handle file system operations.
const fs = require('fs');
const path = require('path');

// Define the absolute path to the sidebar file that `docusaurus-plugin-typedoc` generates.
const typedocSidebarPath = path.resolve(__dirname, './docs/extensions/frameworks-api/typedoc-sidebar.cjs');

/**
 * Recursively processes an array of Docusaurus sidebar items.
 * It finds any 'doc' items and removes the incorrect 'extensions/' prefix
 * from their ID, which is a known issue with the plugin in multi-instance setups.
 *
 * @param {Array<object>} items The array of sidebar items from the generated file.
 * @returns {Array<object>} The corrected array of sidebar items.
 */
function fixTypedocIds(items) {
  return items.map((item) => {
    // 1. Start with a shallow copy of the item.
    const newItem = { ...item };

    // --- FIX 1: Remove 'extensions/' prefix from 'doc' IDs ---
    if (newItem.type === 'doc' && newItem.id && newItem.id.startsWith('extensions/')) {
      newItem.id = newItem.id.replace('extensions/', '');
    }

    // --- RECURSION: Process sub-items if it's a 'category' ---
    if (newItem.type === 'category' && newItem.items) {
      newItem.items = fixTypedocIds(newItem.items);
    }

    // --- FIX 2: Remove 'link' property if it points to an '_api-index' document ---
    const link = newItem.link;

    if (
      link &&
      typeof link === 'object' && link !== null &&
      link.id &&
      typeof link.id === 'string' &&
      link.id.endsWith('_api-index')
    ) {
      // Use object destructuring to create a new object without the 'link' property
      // and return it immediately.
      const { link: removedLink, ...rest } = newItem;

      return rest;
    }

    // Return the (potentially) modified item.
    return newItem;
  });
}

// Initialize an empty array for the TypeDoc sidebar items.
let typedocSidebarItems = [];

// Safely check if the generated `typedoc-sidebar.cjs` file exists.
// This prevents build errors if the file hasn't been generated yet.
if (fs.existsSync(typedocSidebarPath)) {
  // If the file exists, import its contents.
  const originalTypedocSidebar = require(typedocSidebarPath);

  // Run the imported items through our correction function.
  typedocSidebarItems = fixTypedocIds(originalTypedocSidebar);
}

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
          label: 'Frameworks API',
          link:  {
            type: 'doc',
            id:   'frameworks-api',
          },
          items: typedocSidebarItems
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
            'advanced/yarn-link'
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
        'known-issues',
      ]
    },
  ]
};

module.exports = sidebars;
