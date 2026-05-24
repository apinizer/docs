import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Apinizer Dokümantasyonu',
  tagline: 'Full Lifecycle API Management Platform',
  favicon: 'img/favicon.ico',
  url: 'https://docs.apinizer.com',
  baseUrl: '/',
  organizationName: 'apinizer',
  projectName: 'docs',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  onBrokenAnchors: 'warn',
  trailingSlash: false,

  i18n: {
    defaultLocale: 'tr',
    locales: ['tr'],
    localeConfigs: {
      tr: {label: 'Türkçe', direction: 'ltr', htmlLang: 'tr-TR'},
    },
  },

  clientModules: [
    './src/clientModules/pathnameWatcher.ts',
  ],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['tr', 'en'],
        indexDocs: true,
        indexPages: false,
        docsRouteBasePath: ['/tr', '/en'],
        docsPluginIdForPreferredVersion: 'tr',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: false,
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'tr',
        path: 'tr',
        routeBasePath: 'tr',
        sidebarPath: './sidebars-tr.ts',
        editUrl: 'https://github.com/apinizer/docs/edit/main/',
        showLastUpdateTime: true,
        exclude: ['**/.cursor/**', '**/.claude/**', '**/.idea/**', '**/*.bak'],
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'en',
        path: 'en',
        routeBasePath: 'en',
        sidebarPath: './sidebars-en.ts',
        editUrl: 'https://github.com/apinizer/docs/edit/main/',
        showLastUpdateTime: true,
        exclude: ['**/.cursor/**', '**/.claude/**', '**/.idea/**', '**/*.bak'],
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'apiReference',
        path: 'api-reference',
        routeBasePath: 'api-reference',
        sidebarPath: './sidebars-api-reference.ts',
        editUrl: 'https://github.com/apinizer/docs/edit/main/',
        showLastUpdateTime: true,
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {from: '/tr/upgrade/docker-uzerinde-guncelleme', to: '/tr/upgrade/apinizer-surum-yukseltme'},
          {from: '/tr/upgrade/linux-uzerinde-guncelleme', to: '/tr/upgrade/apinizer-surum-yukseltme'},
          {from: '/en/upgrade/upgrading-on-docker', to: '/en/upgrade/apinizer-version-upgrade'},
          {from: '/en/upgrade/upgrading-on-linux', to: '/en/upgrade/apinizer-version-upgrade'},
        ],
        createRedirects(existingPath) {
          if (existingPath === '/tr') {
            return ['/'];
          }
          return undefined;
        },
      },
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    navbar: {
      // No `title` — the logo image already contains the wordmark.
      logo: {
        alt: 'Apinizer',
        src: 'img/logo.png',
        srcDark: 'img/logo-dark.png',
        href: '/tr',
      },
      hideOnScroll: false,
      items: [
        // Turkish tabs — shown only when pathname starts with /tr (CSS rules
        // in src/css/custom.css filter by body[data-pathname]).
        {type: 'docSidebar', sidebarId: 'genel-bakis', docsPluginId: 'tr', label: 'Genel Bakış', position: 'left', className: 'navbar__item--tr'},
        {type: 'docSidebar', sidebarId: 'surumler', docsPluginId: 'tr', label: 'Sürümler', position: 'left', className: 'navbar__item--tr'},
        {type: 'docSidebar', sidebarId: 'kurulum-ve-guncelleme', docsPluginId: 'tr', label: 'Kurulum', position: 'left', className: 'navbar__item--tr'},
        {type: 'docSidebar', sidebarId: 'api-leri-yonetme', docsPluginId: 'tr', label: "API'leri Yönetme", position: 'left', className: 'navbar__item--tr'},
        {type: 'docSidebar', sidebarId: 'yonetim', docsPluginId: 'tr', label: 'Yönetim', position: 'left', className: 'navbar__item--tr'},
        {type: 'docSidebar', sidebarId: 'analitik-ve-i-zleme', docsPluginId: 'tr', label: 'Analitik', position: 'left', className: 'navbar__item--tr'},
        {type: 'docSidebar', sidebarId: 'api-portal', docsPluginId: 'tr', label: 'API Portal', position: 'left', className: 'navbar__item--tr'},
        {type: 'docSidebar', sidebarId: 'operasyon', docsPluginId: 'tr', label: 'Operasyon', position: 'left', className: 'navbar__item--tr'},
        {type: 'docSidebar', sidebarId: 'kilavuzlar', docsPluginId: 'tr', label: 'Kılavuzlar', position: 'left', className: 'navbar__item--tr'},
        // English tabs.
        {type: 'docSidebar', sidebarId: 'overview', docsPluginId: 'en', label: 'Overview', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'versions', docsPluginId: 'en', label: 'Versions', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'installation-and-update', docsPluginId: 'en', label: 'Installation', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'managing-apis', docsPluginId: 'en', label: 'Managing APIs', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'management', docsPluginId: 'en', label: 'Management', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'analytics-and-monitoring', docsPluginId: 'en', label: 'Analytics', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'api-portal', docsPluginId: 'en', label: 'API Portal', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'operations', docsPluginId: 'en', label: 'Operations', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'guides', docsPluginId: 'en', label: 'Guides', position: 'left', className: 'navbar__item--en'},
        // API Reference — shared between TR and EN contexts.
        {type: 'docSidebar', sidebarId: 'api-reference', docsPluginId: 'apiReference', label: 'API Reference', position: 'left', className: 'navbar__item--apiref'},

        {
          type: 'dropdown',
          label: 'TR',
          position: 'right',
          className: 'navbar__locale-dropdown',
          items: [
            {label: 'Türkçe', href: '/tr'},
            {label: 'English', href: '/en'},
          ],
        },
        {
          href: 'https://apinizer.com',
          label: 'Web Sitesi',
          position: 'right',
        },
        {
          href: 'https://demo.apinizer.com/',
          label: 'Login',
          position: 'right',
          className: 'navbar__item--cta',
        },
      ],
    },
    // Footer removed per design — Mintlify layout has no footer.
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'java', 'json', 'yaml', 'groovy', 'sql', 'docker', 'nginx', 'properties'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
