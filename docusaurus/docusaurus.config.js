// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title:                 'Rancher UI DevKit',
  tagline:               'Rancher UI development kit',
  url:                   'https://rancher.github.io',
  baseUrl:               '/dashboard/',
  onBrokenLinks:         'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon:               'img/favicon.ico',
  trailingSlash:         false,

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'rancher', // Usually your GitHub org/user name.
  projectName:      'dashboard', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales:       ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath:      '/',
          sidebarPath:        require.resolve('./sidebars.js'),
          showLastUpdateTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
        },
        blog: {
          showReadingTime:  true,
          blogTitle:        'Rancher UX/UI Blog',
          blogDescription:  'Recent and upcoming changes to Rancher Manager and associated projects and products',
          postsPerPage:     'ALL',
          blogSidebarCount: 'ALL',
          blogSidebarTitle: 'All Posts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
        },
        theme: { customCss: require.resolve('./src/css/custom.css') },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'UI DevKit',
        logo:  {
          alt:     'Rancher Logo',
          src:     'img/rancher-logo.svg',
          srcDark: 'img/rancher-logo-dark.svg',
        },
        items: [
          {
            type:     'doc',
            docId:    'home',
            position: 'right',
            label:    'Docs',
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
