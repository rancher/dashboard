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
