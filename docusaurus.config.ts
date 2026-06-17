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
        // English-only language tables to keep the per-locale shard small.
        language: ['en'],
        indexDocs: true,
        indexPages: false,
        indexBlog: false,
        docsRouteBasePath: ['/tr', '/en', '/api-reference'],
        docsPluginIdForPreferredVersion: 'tr',
        // Per-context shards (tr/en/api-reference) so the global combined
        // index is not the only path — needed for Cloudflare Pages's 25 MB
        // single-asset cap.
        searchContextByPaths: ['tr', 'en', 'api-reference'],
        // Aggressive size cuts: drop stop-word filter and the lunr default
        // stemmer; both add per-token metadata to the index. We still get
        // exact + prefix search, which is the dominant use case.
        removeDefaultStopWordFilter: true,
        removeDefaultStemmer: true,
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
        {type: 'docSidebar', sidebarId: 'api-leri-yonetme', docsPluginId: 'tr', label: 'Geliştirme', position: 'left', className: 'navbar__item--tr'},
        {type: 'docSidebar', sidebarId: 'yonetim', docsPluginId: 'tr', label: 'Yönetim', position: 'left', className: 'navbar__item--tr'},
        {type: 'docSidebar', sidebarId: 'analitik-ve-i-zleme', docsPluginId: 'tr', label: 'Analitik', position: 'left', className: 'navbar__item--tr'},
        {type: 'docSidebar', sidebarId: 'api-portal', docsPluginId: 'tr', label: 'API Portal', position: 'left', className: 'navbar__item--tr'},
        {type: 'docSidebar', sidebarId: 'operasyon', docsPluginId: 'tr', label: 'Operasyon', position: 'left', className: 'navbar__item--tr'},
        {type: 'docSidebar', sidebarId: 'kilavuzlar', docsPluginId: 'tr', label: 'Kılavuzlar', position: 'left', className: 'navbar__item--tr'},
        {type: 'docSidebar', sidebarId: 'ai-gateway', docsPluginId: 'tr', label: 'AI Gateway', position: 'left', className: 'navbar__item--tr'},
        // English tabs.
        {type: 'docSidebar', sidebarId: 'overview', docsPluginId: 'en', label: 'Overview', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'versions', docsPluginId: 'en', label: 'Versions', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'installation-and-update', docsPluginId: 'en', label: 'Installation', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'managing-apis', docsPluginId: 'en', label: 'Develop', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'management', docsPluginId: 'en', label: 'Administration', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'analytics-and-monitoring', docsPluginId: 'en', label: 'Analytics', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'api-portal', docsPluginId: 'en', label: 'API Portal', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'operations', docsPluginId: 'en', label: 'Operations', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'guides', docsPluginId: 'en', label: 'Guides', position: 'left', className: 'navbar__item--en'},
        {type: 'docSidebar', sidebarId: 'ai-gateway', docsPluginId: 'en', label: 'AI Gateway', position: 'left', className: 'navbar__item--en'},
        // API Reference — shared between TR and EN contexts.
        {type: 'docSidebar', sidebarId: 'api-reference', docsPluginId: 'apiReference', label: 'API Reference', position: 'left', className: 'navbar__item--apiref'},

        // Two locale dropdowns — CSS shows the one matching the current
        // path so the trigger label always reflects the active language.
        {
          type: 'dropdown',
          label: 'Türkçe',
          position: 'right',
          className: 'navbar__locale-dropdown navbar__locale--tr',
          items: [
            {label: 'Türkçe', href: '/tr', className: 'locale-active'},
            {label: 'English', href: '/en'},
          ],
        },
        {
          type: 'dropdown',
          label: 'English',
          position: 'right',
          className: 'navbar__locale-dropdown navbar__locale--en',
          items: [
            {label: 'Türkçe', href: '/tr'},
            {label: 'English', href: '/en', className: 'locale-active'},
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
