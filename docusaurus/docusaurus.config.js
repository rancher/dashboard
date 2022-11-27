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
        blog:  false,
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
          alt: 'Rancher Logo',
          src: 'img/rancher-logo.svg',
        },
        items: [
          {
            type:     'doc',
            docId:    'getting-started/concepts',
            position: 'right',
            label:    'Docs',
          },
          {
            href:     'https://rancher.github.io/storybook/',
            position: 'right',
            label:    'Components & Design kit',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            label: 'Stack',
            href:  'https://slack.rancher.io/',
          },
          {
            label: 'Github',
            href:  'https://github.com/rancher/',
          },
        ],
        copyright: `Copyright © ${ new Date().getFullYear() } Rancher. All rights reserved.`,
      },
      prism: {
        theme:     lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
