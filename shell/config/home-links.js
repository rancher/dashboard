import { DOCS_BASE } from '@shell/config/private-label';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { allHash } from '@shell/utils/promise';

const DEFAULT_LINKS = [
  {
    key:     'docs',
    value:   DOCS_BASE,
    enabled: true,
  },
  {
    key:     'forums',
    value:   'https://forums.rancher.com/',
    enabled: true,
  },
  {
    key:     'slack',
    value:   'https://slack.rancher.io/',
    enabled: true,
  },
  {
    key:     'issues',
    value:   'https://github.com/rancher/dashboard/issues/new/choose',
    enabled: true,
  },
  {
    key:     'getStarted',
    value:   '/docs/getting-started',
    enabled: true,
  },
];

const SUPPORT_LINK = {
  key:      'commercialSupport',
  value:    '/support',
  enabled:  true,
  readonly: true
};

// We add a version attribute to the setting so we know what has been migrated and which version of the setting we have
export const CUSTOM_LINKS_VERSION = 'v1';

// Fetch the settings required for the links, taking into account legacy settings if we have not migrated
export async function fetchLinks(store, hasSupport, isSupportPage, t) {
  let uiLinks = {};

  try {
    const uiLinksSetting = await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.UI_CUSTOM_LINKS });

    uiLinks = JSON.parse(uiLinksSetting.value);
  } catch (e) {
    console.warn('Could not parse custom link settings', e); // eslint-disable-line no-console
  }

  // If uiLinks is set and has the correct version, then we are okay, otherwise we need to migrate from the old settings
  if (uiLinks?.version === CUSTOM_LINKS_VERSION) {
    // Map out the default settings, as we only store keys of the ones to show
    if (uiLinks.defaults) {
      const defaults = [...DEFAULT_LINKS];

      // Map the link name stored to the default link, if it exists
      defaults.forEach((link) => {
        const enabled = uiLinks.defaults.find(linkName => linkName === link.key);

        link.enabled = !!enabled;
      });

      uiLinks.defaults = defaults;
    }

    return ensureSupportLink(uiLinks, hasSupport, isSupportPage, t);
  }

  // No new setting, so return the required structure
  // We don't migrate here, as we may not have permissions to create the setting
  const links = {
    version:  CUSTOM_LINKS_VERSION,
    defaults: [...DEFAULT_LINKS],
    custom:   []
  };

  // There are two legacy settings:
  // SETTING.ISSUES - can specify a custom link to use for 'File an issue'
  // SETTING.COMMUNITY_LINKS - can specify whether to hide all of the default links (other than 'File an issue')
  try {
    const { uiIssuesSetting, uiCommunitySetting } = await allHash({
      uiIssuesSetting:    store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.ISSUES }),
      uiCommunitySetting: store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.COMMUNITY_LINKS })
    });

    // Should we show the default set of links?
    if (uiCommunitySetting?.value === 'false') {
      // Hide all of the default links
      links.defaults.forEach(link => (link.enabled = false));
    }

    // Do we have a custom 'File an issue' link ?
    if (uiIssuesSetting?.value) {
      links.custom.push({
        label: t ? t('customLinks.defaults.issues') : 'Issues',
        value: uiIssuesSetting.value
      });

      // Hide the default 'File an issue' link
      const issueLink = links.defaults?.find(link => link.key === 'issues');

      if (issueLink) {
        issueLink.enabled = false;
        issueLink.readOnly = true;
      }
    }
  } catch (e) {
    console.warn('Could not parse legacy link settings', e); // eslint-disable-line no-console
  }

  return ensureSupportLink(links, hasSupport, isSupportPage, t);
}

// Ensure the support link is added if needed
function ensureSupportLink(links, hasSupport, isSupportPage, t) {
  if (!hasSupport && !isSupportPage) {
    const supportLink = links.defaults?.find(link => link.key === 'commercialSupport');

    if (!supportLink) {
      links.defaults.push(SUPPORT_LINK);
    }
  }

  // Localise the default links
  links.defaults = links.defaults.map((link) => {
    return {
      ...link,
      label: t(`'customLinks.defaults.${ link.key }`)
    };
  });

  // Ensure that if any custom links have the same name as a default link, we use the custom link
  const customNamesMap = links.custom.reduce((linkMap, link) => {
    linkMap[link.label] = link;

    return linkMap;
  }, {});

  // If any custom links have the same name as a default link, then hide and mark readonly the default link
  // Main use case if the 'File an Issue' link when migrating the old settings
  links.defaults.forEach((link) => {
    if (customNamesMap[link.label]) {
      link.enabled = false;
      link.readonly = true;
    }
  });

  return links;
}
