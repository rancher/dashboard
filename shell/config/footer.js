import { DOCS_BASE } from '@shell/config/private-label';

// Deprecated
export function options(isSupport, issues, hideRancher) {
  if (!issues) {
    if (hideRancher) {
      return { };
    }
    issues = 'https://github.com/rancher/dashboard/issues/new';
  } else if (hideRancher) {
    return { 'File an issue': issues };
  }

  const links = {
    docs:        DOCS_BASE,
    forums:     'https://forums.rancher.com/',
    slack:      'https://slack.rancher.io',
    issues,
    getStarted: '/docs/getting-started'
  };

  if (!isSupport) {
    links['Commercial Support'] = '/support';
  }

  return links;
}
