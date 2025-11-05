// @ts-check
const { themes } = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title:                 'Rancher UI Extensions',
  tagline:               'Rancher UI Extensions Development Kit',
  url:                   'https://extensions.rancher.io',
  baseUrl:               '/',
  onBrokenLinks:         'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon:               'img/favicon.ico',
  trailingSlash:         false,

  // GitHub pages deployment config.
  organizationName: 'rancher',
  projectName:      'dashboard',

  i18n: {
    defaultLocale: 'en',
    locales:       ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: false,
        blog: {
          showReadingTime:  true,
          blogTitle:        'Rancher UX/UI Blog',
          blogDescription:  'Recent and upcoming changes to Rancher Manager and associated projects and products',
          postsPerPage:     'ALL',
          blogSidebarCount: 'ALL',
          blogSidebarTitle: 'All Posts',
        },
        theme: { customCss: require.resolve('./src/css/custom.css') },
      }),
    ],
  ],

  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        // Set to true to hide the source path information entirely.
        disableSources: true,

        // This removes the prefix from the title of a generated page
        // Ex: "Interface: ModalApi" vs "ModalApi"
        textContentMappings: { 'title.memberPage': '{name}' },

        // show params as code blocks
        useCodeBlocks: true,

        // The entry point for TypeDoc to start scanning for files.
        // The path is relative to the `docusaurus` directory.
        // entryPoints: ['../shell/apis/shell/*'],
        entryPoints: ['../shell/apis/intf/shell.ts'],

        // The tsconfig file for TypeDoc to use.
        // This is CRITICAL to point to our special, isolated config
        // to avoid the thousands of compilation errors from the main project.
        tsconfig: 'tsconfig-typedoc-integration.json',

        // The output directory for the generated markdown files.
        // We are targeting the specific versioned folder for the "next" version
        // and placing it directly into the "advanced" subfolder.
        out: 'docs/extensions/shell-api',

        // disables REAME as default entry point
        readme: 'none',

        // prevents deletion of files that are in "out" directory
        cleanOutputDir: false,

        // allows auto-generation of the sidebar for the auto-generated items
        sidebar: { autoConfiguration: true },

        // since we can't prevent the generation of a "bad" index file, we rename it to something harmless
        entryFileName: '_api-index.md',

        // A unique ID for this plugin instance. Needed so that it generates all the files successfully (including sidebar entries)
        id: 'api-docs',

        // exclude all code comments marked as @internal
        excludeInternal: true
      },
    ],
    [require.resolve('docusaurus-lunr-search'), { excludeRoutes: ['internal/*', 'internal/**/*', '/internal/*', '/internal/**/*', 'blog/*', 'blog/**/*', '/blog/*', '/blog/**/*'] }
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id:                 'extensions',
        path:               'docs/extensions',
        routeBasePath:      'extensions',
        sidebarPath:        require.resolve('./extensionSidebar.js'),
        showLastUpdateTime: true,
        // Enable versioning for extensions
        lastVersion:        'current',
        versions:           {
          current: {
            label: 'v3',
            path:  'next',
          },
        },
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id:                 'internal',
        path:               'docs/internal',
        routeBasePath:      'internal',
        sidebarPath:        require.resolve('./internalSidebar.js'),
        showLastUpdateTime: true
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        createRedirects(existingPath) {
          // This function is invoked once per existing doc page, and we
          // must return the “old” routes that we want to map to that doc’s path
          if (existingPath.startsWith('/extensions/next')) {
            // Generate the "old" route we want to redirect from
            const oldPath = existingPath.replace('/extensions/next', '/extensions');

            return [oldPath];
          }

          return undefined; // Return a falsy value: no redirect created
        },
      },
    ],
    ['./plugins/catalog', {}]
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'UI Extensions',
        logo:  {
          alt:     'Rancher Logo',
          src:     'img/rancher-logo.svg',
          srcDark: 'img/rancher-logo-dark.svg',
        },
        items: [
          {
            type:                        'docsVersionDropdown',
            docsPluginId:                'extensions',
            position:                    'left',
            dropdownActiveClassDisabled: true,
          },
          {
            type:         'doc',
            docId:        'home',
            docsPluginId: 'extensions',
            position:     'right',
            label:        'Docs',
          },
          {
            type:         'doc',
            docId:        'catalog',
            docsPluginId: 'extensions',
            position:     'right',
            label:        'Catalog',
          },
          {
            to: '/blog', label: 'Blog', position: 'right'
          },
          {
            href:     'https://rancher.github.io/storybook/',
            position: 'right',
            label:    'Components & Design kit',
          },
        ],
      },
      footer: {
        style:     'dark',
        copyright: `Copyright © ${ new Date().getFullYear() } Rancher. All rights reserved.`,
      },
      prism: {
        theme:     lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
